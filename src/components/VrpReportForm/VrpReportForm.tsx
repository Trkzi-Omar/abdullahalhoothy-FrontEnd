import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import Modal from '../common/Modal';

import { toast } from 'sonner';
import { FaArrowLeft, FaExclamationTriangle, FaChevronDown, FaDatabase, FaTimes } from 'react-icons/fa';
import {
  CustomReportData,
  FormErrors,
} from '../../types/allTypesAndInterfaces';

import { VrpReportData, UserLayer } from '../../types/vrp';
import type { GeoJsonPolygon, GeoJsonFeature, GeoJsonFeatureCollection } from '../../types/geojson';

// Import step components
import BasicInformationStep from './components/BasicInformationStep';
import SetAttributeStep from './components/AttributesStep';

import {toLonLat, fromLonLat} from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import Control from 'ol/control/Control';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import GeoJSON from 'ol/format/GeoJSON';
import { isEmpty as isEmptyExtent } from 'ol/extent';
import {Stroke, Circle, Fill, Icon, Style} from 'ol/style';
import {defaults as defaultControls } from 'ol/control/defaults';
import { useMap, Map, View, TileLayer, VectorLayer } from 'react-openlayers';
import 'react-openlayers/dist/index.css';
import { t } from '../../i18n';
import { translateError } from '../../utils/apiMessages';
import ExcelIcon from '../../assets/images/excel.svg';
import PdfIcon from '../../assets/images/pdf.svg';
import Html5Icon from '../../assets/images/html5.svg';
import RoutesMapIcon from '../../assets/images/routes_map.svg';
import ClustersMapIcon from '../../assets/images/clusters_map.svg';
import ShopsMapIcon from '../../assets/images/shops_map.svg';
import MapMarkerDriver from '../../assets/images/map-marker-driver.svg';
import MapMarkerWarehouse from '../../assets/images/map-marker-warehouse.svg';

const DRAW_CONTROL_STYLE = `
.draw-control { top: 65px; inset-inline-start: .5em; }
.draw-control-D { top: 95px; inset-inline-start: .5em; }
.draw-control-W { top: 125px; inset-inline-start: .5em; }
.draw-control-active > button { outline: 1px solid black; }
.ol-control.draw-control button { 
  min-width: 5.5rem; 
  font-size: 0.75rem !important; 
  padding: 2px 6px; 
  line-height: 1.2;
  font-family: inherit;
}
`;

const MAPBOX_STREETS_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/512/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_KEY}`;

type FormInputValue = CustomReportData[keyof CustomReportData];


class DrawControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options?: { letter?: string; target?: HTMLElement }) {
    const options = opt_options || {};

    const letter = options.letter;
    const labels: Record<string, string> = { P: 'Polygon', D: 'Driver', W: 'Warehouse' };
    const label = labels[letter ?? ''] ?? letter;

    const button = document.createElement('button');
    button.innerHTML = label;
    button.title = label;
    button.dataset.letter = letter;

    const element = document.createElement('div');
    element.className = 'draw-control ol-unselectable ol-control draw-control-'+options.letter;
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', function() {
    	Array.from(document.querySelectorAll(".draw-control-active"))
	    	.forEach(v => element !== v && v.classList.toggle("draw-control-active"));
    	element.classList.toggle("draw-control-active");
    	button.dispatchEvent(new CustomEvent("toggleDraw", {bubbles: true}))
    }, false);
  }
}

const drawStyle = new Style({
	stroke: new Stroke({color: "#FF6600"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Circle({
		stroke: new Stroke({color: "#FF6600"}),
		fill: new Fill({color: "#FFFFFF7F"}),
		radius: 5,
	}),
})
const driverStyle = new Style({
	stroke: new Stroke({color: "cyan"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Icon({
		src: MapMarkerDriver,
	}),
})

const warehouseStyle = new Style({
	stroke: new Stroke({color: "magenta"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Icon({
		src: MapMarkerWarehouse,
	}),
})
type VrpMapDrawProps = {
  source: VectorSource;
  handleInputChange: (field: string, value: FormInputValue) => void;
  formData: VrpReportData | null;
};

const cityCoords = {
	"Jeddah": [21.54333, 39.17278],
	"Riyadh": [24.6333333, 46.716667],
	"Mecca": [21.422510, 39.826168],
}
const VrpMapDraw = ({formData, source, handleInputChange}: VrpMapDrawProps) => {
  const map = useMap();
  const [drawers] = useState(() => [
    new Draw({
      source: source,
      type: "Polygon",
      // No freehand — click-vertex mode like geojson.io
      geometryName: "draw",
      style: drawStyle,
    }),
    new Draw({
      source: source,
      type: "Point",
      geometryName: "driver",
      style: driverStyle,
    }),
    new Draw({
      source: source,
      type: "Point",
      geometryName: "warehouse",
      style: warehouseStyle,
    }),
  ]);
  const [oldCity, setOldCity] = useState("");
  const [draw, setDraw] = useState(0);
  if(map && formData && oldCity != formData.city_name) {
    const city = formData.city_name;
    setOldCity(city);
    map.getView().setCenter(fromLonLat(([...(cityCoords as Record<string, number[]>)[city]] as number[]).reverse()));
  }

  // Restore saved polygon from formData on first map load
  useEffect(() => {
    if (!map) return;
    const fc = formData?.polygons ?? null;
    if (!fc?.features?.length) return;
    try {
      const features = new GeoJSON().readFeatures(fc, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      features.forEach(f => {
        const g = f.getGeometry();
        f.setGeometryName('draw');
        if (g) f.setGeometry(g);
      });
      source.getFeatures()
        .filter(f => f.getGeometryName() === 'draw')
        .forEach(f => source.removeFeature(f));
      source.addFeatures(features);
    } catch { /* ignore malformed saved polygon */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Modify interaction — allows dragging vertices/edges after drawing
  useEffect(() => {
    if (!map) return;
    const modify = new Modify({ source });
    map.addInteraction(modify);
    modify.on('modifyend', (e) => {
      e.features.forEach(feature => {
        const name = (feature as unknown as { getGeometryName: () => string }).getGeometryName();
        const geom = (feature as unknown as { getGeometry: () => unknown }).getGeometry() as
          { getCoordinates: () => unknown };
        if (name === 'draw') {
          const coords = ((geom.getCoordinates() as unknown) as number[][][])[0].map(v => toLonLat(v));
          handleInputChange("polygons", {
            type: 'FeatureCollection' as const,
            features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }]
          } as unknown as FormInputValue);
        } else if (name === 'driver') {
          const coords = toLonLat((geom.getCoordinates() as unknown) as number[]);
          handleInputChange("groups_info", [Object.assign({}, formData?.groups_info?.[0] ?? {}, {
            lng: coords[0], lat: coords[1],
          })] as unknown as FormInputValue);
        } else if (name === 'warehouse') {
          const coords = toLonLat((geom.getCoordinates() as unknown) as number[]);
          handleInputChange("warehouse_lat", coords[1]);
          handleInputChange("warehouse_lng", coords[0]);
        }
      });
    });
    return () => { map.removeInteraction(modify); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, source]);

  useEffect(() => {
    drawers.forEach(v => {
      v.on("drawend", (ev) => {
        const name = (ev.feature as unknown as { getGeometryName: () => string }).getGeometryName();
        if (name === "draw") {
          const geom = ev.feature.getGeometry() as unknown as { getCoordinates: () => number[][][] };
          const tmpCoords = geom.getCoordinates()[0].map(v => toLonLat(v));
          handleInputChange("polygons", {
            type: 'FeatureCollection' as const,
            features: [{ type: 'Feature', properties: {}, geometry: { coordinates: [tmpCoords], type: 'Polygon' } }]
          } as unknown as FormInputValue);
        } else if (name === "driver") {
          const geom = ev.feature.getGeometry() as unknown as { getCoordinates: () => number[] };
          const tmpCoords = toLonLat(geom.getCoordinates());
          handleInputChange("groups_info", [Object.assign({}, formData?.groups_info?.[0] ?? {}, {
            lng: tmpCoords[0], lat: tmpCoords[1],
          })] as unknown as FormInputValue);
        } else if (name === "warehouse") {
          const geom = ev.feature.getGeometry() as unknown as { getCoordinates: () => number[] };
          const tmpCoords = toLonLat(geom.getCoordinates());
          handleInputChange("warehouse_lat", tmpCoords[1]);
          handleInputChange("warehouse_lng", tmpCoords[0]);
        }
      });
      v.on("drawstart", () => {
        source.getFeatures()
          .filter(f => f.getGeometryName() === (v as unknown as { geometryName_: string }).geometryName_)
          .forEach(f => source.removeFeature(f));
      });
    });
  }, [drawers, formData, handleInputChange, source]);

  useEffect(() => {
    if (!map) return;
    drawers.forEach(v => map.removeInteraction(v));
    if (draw > 0) map.addInteraction(drawers[draw - 1]);
    const el = map.getTargetElement();
    const handler = (e: Event) => {
      const letter = (e.target as HTMLButtonElement).dataset.letter;
      if (letter === "P") setDraw(d => d === 1 ? 0 : 1);
      else if (letter === "D") setDraw(d => d === 2 ? 0 : 2);
      else if (letter === "W") setDraw(d => d === 3 ? 0 : 3);
    };
    el.addEventListener("toggleDraw", handler);
    return () => el.removeEventListener("toggleDraw", handler);
  }, [draw, drawers, map]);

  return null;
};

const VrpMap = ({formData, handleInputChange}: { formData: VrpReportData | null; handleInputChange: VrpMapDrawProps['handleInputChange'] }) => {
  const mapRef = useRef<import('ol/Map').default | null>(null);
  // Stable source — must not be recreated on every render
  const [drawSource] = useState(() => new VectorSource({ wrapX: false }));
  const [panelOpen, setPanelOpen] = useState(false);
  const [geoJsonText, setGeoJsonText] = useState('');
  const [geoJsonError, setGeoJsonError] = useState('');

  const openPanel = () => {
    const current = formData?.polygons;
    setGeoJsonText(current?.features?.length ? JSON.stringify(current, null, 2) : '');
    setGeoJsonError('');
    setPanelOpen(true);
  };

  const applyGeoJson = () => {
    setGeoJsonError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(geoJsonText);
    } catch {
      setGeoJsonError(t("invalid-json"));
      return;
    }
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      setGeoJsonError(t("must-be-a-geojson-featurecollection-feature-or-polygon"));
      return;
    }
    const type = (parsed as { type?: unknown }).type;
    if (type !== 'FeatureCollection' && type !== 'Feature' && type !== 'Polygon') {
      setGeoJsonError(t("must-be-a-geojson-featurecollection-feature-or-polygon"));
      return;
    }
    try {
      const fmt = new GeoJSON();
      const readerOptions = { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' };
      const normalizedGeoJson: GeoJsonFeatureCollection = type === 'FeatureCollection'
        ? (parsed as GeoJsonFeatureCollection)
        : {
            type: 'FeatureCollection',
            features: [
              type === 'Feature'
                ? (parsed as GeoJsonFeature)
                : ({ type: 'Feature', properties: {}, geometry: parsed as GeoJsonPolygon }),
            ],
          };
      const features = fmt.readFeatures(normalizedGeoJson, readerOptions);
      if (!features.length) { setGeoJsonError(t("no-features-found")); return; }
      features.forEach(f => {
        const geometry = f.getGeometry();
        f.setGeometryName('draw');
        if (geometry) f.setGeometry(geometry);
      });
      drawSource.getFeatures().filter(f => f.getGeometryName() === 'draw').forEach(f => drawSource.removeFeature(f));
      drawSource.addFeatures(features);
      // Normalise to FeatureCollection for formData
      const fc = type === 'FeatureCollection' ? parsed : {
        type: 'FeatureCollection',
        features: type === 'Feature' ? [parsed] : [{ type: 'Feature', properties: {}, geometry: parsed }],
      };
      handleInputChange('polygons', fc as unknown as FormInputValue);
      // Fly map to polygon extent
      const extent = drawSource.getExtent();
      if (extent && !isEmptyExtent(extent) && mapRef.current) {
        mapRef.current.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 16 });
      }
      setPanelOpen(false);
    } catch (err) {
      setGeoJsonError(`${t("could-not-parse-geometry")}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="relative w-full h-full">
      <style>{DRAW_CONTROL_STYLE}</style>
      <Map ref={mapRef} controls={defaultControls().extend(["P", "D", "W"].map(v => new DrawControl({ letter: v })))}>
        <TileLayer
          source={new XYZ({
            url: MAPBOX_STREETS_TILE_URL,
            tileSize: 512,
            attributions: '© Mapbox © OpenStreetMap',
          })}
        />
        <VectorLayer
          source={drawSource}
          style={(feature) => {
            const name = (feature as unknown as { getGeometryName: () => string }).getGeometryName();
            if (name === "draw") return drawStyle;
            if (name === "driver") return driverStyle;
            if (name === "warehouse") return warehouseStyle;
          }}
        />
        <VrpMapDraw formData={formData} source={drawSource} handleInputChange={handleInputChange} />
        <View center={fromLonLat(([...(cityCoords as Record<string, number[]>)[formData?.city_name ?? 'Riyadh']] as number[]).reverse())} zoom={13} />
      </Map>

      {/* GeoJSON paste panel toggle button — top-right inside map */}
      <button
        type="button"
        onClick={panelOpen ? () => setPanelOpen(false) : openPanel}
        title={t("paste-geojson-polygon")}
        className="absolute top-3 end-3 z-10 bg-white border border-gray-300 rounded-lg shadow px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
      >
        <span className="font-mono text-primary">&#123;&#125;</span>
        {panelOpen ? t("close") : 'GeoJSON'}
      </button>

      {/* GeoJSON paste panel — drops down from top-right */}
      {panelOpen && (
        <div className="absolute top-11 end-3 z-10 w-72 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{t("paste-geojson-polygon")}</span>
            <button type="button" onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          <textarea
            className="flex-1 p-2 text-xs font-mono text-gray-800 resize-none border-none outline-none min-h-[180px]"
            dir="ltr"
            placeholder={'{\n  "type": "FeatureCollection",\n  "features": [...]\n}'}
            value={geoJsonText}
            onChange={e => { setGeoJsonText(e.target.value); setGeoJsonError(''); }}
            spellCheck={false}
          />
          {geoJsonError && (
            <p className="px-3 py-1 text-xs text-red-600 bg-red-50 border-t border-red-100">{geoJsonError}</p>
          )}
          <div className="px-3 py-2 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => { setGeoJsonText(''); setGeoJsonError(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">{t("clear")}</button>
            <button type="button" onClick={applyGeoJson}
              className="text-xs font-medium bg-primary text-white px-3 py-1 rounded-md hover:bg-primary/90">
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formDataKeys = ["warehouse_lat", "warehouse_lng", "manager_phone", "num_groups", "polygons", "country_name", "city_name", "user_id", "groups_info"];

const INITIAL_VRP_FORM_DATA: Omit<VrpReportData, 'user_id'> & { user_id?: string } = {
  "city_name": "Riyadh",
  "country_name": "Saudi Arabia",
  "user_id": undefined,
  "polygons": {
    "type": "FeatureCollection",
    "features": []
  },
  "boolean_query": "",
  "excluded_names": [],
  "num_groups": 1,
  "outlier_cut_km": 0.5,
  "warehouse_lat": null,
  "warehouse_lng": null,
  "group_size_prune_max": 0.05,
  "max_solving_time": 30,
  "num_work_days": 12,
  "current_daily_km_per_van": 200,
  "weekly_refill_sar": 300,
  "work_hours_per_day": 10,
  "store_visit_minutes": 20,
  "current_stores_per_day": 20,
  "driver_monthly_salary_sar": 3000,
  "planner_monthly_salary_sar": 5000,
  "work_days_per_week": 6,
  "work_days_per_month": 24,
  "avg_revenue_per_store_sar": 1500,
  "revenue_period_days": 14,
  "manager_phone": "",
  "uploaded_layer_id": null,
  "use_uploaded_data_only": false,
  "mandatory_layer_id": null,
  "groups_info": [
    {
      "lat": null,
      "lng": null,
      "phone": ""
    }
  ]
};

const ADVANCED_FORM_FIELDS = [
  { key: 'num_work_days', labelKey: 'number-of-work-days', step: 1 },
  { key: 'departure_hour', labelKey: 'departure-hour-0-23', step: 1, min: 0, max: 23 },
  { key: 'osrm_multiplier', labelKey: 'traffic-multiplier', step: 0.1 },
  { key: 'current_daily_km_per_van', labelKey: 'current-daily-km-per-van', step: 1 },
  { key: 'weekly_refill_sar', labelKey: 'weekly-refill-sar', step: 1 },
  { key: 'current_stores_per_day', labelKey: 'current-stores-per-day', step: 1 },
  { key: 'driver_monthly_salary_sar', labelKey: 'driver-monthly-salary-sar', step: 100 },
  { key: 'planner_monthly_salary_sar', labelKey: 'planner-monthly-salary-sar', step: 100 },
  { key: 'work_days_per_week', labelKey: 'work-days-per-week', step: 1 },
  { key: 'work_days_per_month', labelKey: 'work-days-per-month', step: 1 },
  { key: 'avg_revenue_per_store_sar', labelKey: 'avg-revenue-per-store-sar', step: 100 },
] as Array<{ key: string; labelKey: string; step: number; min?: number; max?: number }>;

const REPORT_FILE_TYPES = [
  { id: "excel", urlKey: "excel_url", icon: ExcelIcon },
  { id: "html5", urlKey: "html_url", icon: Html5Icon },
  { id: "pdf", urlKey: "pdf_url", icon: PdfIcon },
  { id: "routes_map", urlKey: "routes_map_url", icon: RoutesMapIcon },
  { id: "shops_map", urlKey: "shops_map_url", icon: ShopsMapIcon },
  { id: "clusters_map", urlKey: "clusters_map_url", icon: ClustersMapIcon },
] as Array<{id: string; urlKey: string; icon: string}>;

const VRP_STORAGE_KEY = 'vrp_form_data';

const CustomReportForm = () => {
  const { authResponse } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<string[]>([]);
  const [userLayers, setUserLayers] = useState<UserLayer[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Lazy init: restore from localStorage, falling back to defaults
  const [isRestoredFromCache] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(VRP_STORAGE_KEY);
      return !!saved && !!JSON.parse(saved);
    } catch { return false; }
  });

  const [formData, setFormData] = useState<VrpReportData | null>(() => {
    try {
      const saved = localStorage.getItem(VRP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<VrpReportData>;
        // Always refresh user_id from current auth session
        return { ...INITIAL_VRP_FORM_DATA, ...parsed } as unknown as VrpReportData;
      }
    } catch { /* ignore */ }
    return { ...INITIAL_VRP_FORM_DATA } as unknown as VrpReportData;
  });
  // useEffect(() => console.log(formData), [formData]);
 
  const [errors, setErrors] = useState<FormErrors>({});
  const [resp, setResp] = useState<Record<string, string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [excludeInput, setExcludeInput] = useState('');
  const businessType = formData?.Type || 'pharmacy';

  // New state for report type selection

  // Payment method state
  const [showPaymentMethodForm, ] = useState(false);
  
  // Set user_id when component mounts
  useEffect(() => {
    if (authResponse && 'localId' in authResponse && formData && !formData.user_id) {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              user_id: authResponse.localId,
            }
          : null
      );
    }
  }, [authResponse, formData]);

  // Persist form data to localStorage on every change (skip user_id — restored from auth)
  useEffect(() => {
    if (!formData) return;
    try {
      const { user_id: _uid, ...rest } = formData;
      void _uid;
      localStorage.setItem(VRP_STORAGE_KEY, JSON.stringify(rest));
    } catch { /* quota exceeded etc. */ }
  }, [formData]);

  const handleCategoryLoad = useCallback(async () => {
    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: 'get',
      });

      const data = res.data?.data;

      // Extract all subcategory arrays and flatten them
      const allSubcategories = Object.values(data).flat();

      // Ensure they are strings
      const subcategoryList = Array.from(
        new Set(allSubcategories.filter((item): item is string => typeof item === 'string'))
      );
      setCategories(subcategoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    handleCategoryLoad();
  }, [handleCategoryLoad]);

  useEffect(() => {
    if (!authResponse?.localId) return;
    apiRequest({
      url: urls.layers_upload_file_all,
      method: 'POST',
      body: { user_id: authResponse.localId } as Record<string, unknown>,
    }).then((res: unknown) => {
      const r = res as { data?: { data?: UserLayer[] } };
      setUserLayers(r.data?.data ?? []);
    }).catch(() => {
      setUserLayers([]);
    });
  }, [authResponse?.localId]);

  // Separate validation function that doesn't update state (for use during render)
  const handleInputChange = (field: string, value: FormInputValue) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [field]: value,
            ...(field === 'Type'
              ? {
                  potential_business_type: value,
                }
              : {}),
          }
        : null
    );

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAttributeChange = (key: string, value: number | string | string[]) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [key]: value,
          }
        : null
    );
  };

  
  return (
    <main className="fixed inset-0 w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header - No background, hide title on last step */}
      <div className="px-4 pt-2 pb-1 text-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
          >
            <FaArrowLeft className="w-3 h-3 me-1 rtl:rotate-180" />
            <span>{t("back")}</span>
          </button>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content Area - No scrolling, fits viewport */}
      <div className="flex-1 overflow-hidden flex flex-col pb-12">
        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-24`}>
	        <form className="h-full flex flex-col py-4 gap-2" 
          onInvalid={async e => {
          	e.preventDefault()
          }}
          onSubmit={async e => {
	          e.preventDefault();
	        }}>
            {/* Current Step Content */}
            <div className={`flex-1 gap-2 py-4 flex flex-col`}>
              {/* Restored from cache banner */}
              {isRestoredFromCache && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span>{t("loaded-from-your-last-session")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(VRP_STORAGE_KEY);
                      setFormData({ ...INITIAL_VRP_FORM_DATA, user_id: authResponse?.localId ?? '' });
                    }}
                    className="ms-3 underline hover:no-underline font-medium"
                  >
                    {t("clear")}
                  </button>
                </div>
              )}
              {<BasicInformationStep
				        formData={formData}
				        errors={errors}
				        onInputChange={handleInputChange}
				        disabled={isSubmitting}
				      />}
		          {/* Uploaded Layers */}
		          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
		            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
		              <FaDatabase className="w-4 h-4 text-primary" />
		              {t("your-uploaded-layers")}
		            </h4>
		            {userLayers.length === 0 ? (
		              <p className="text-xs text-gray-500">{t("no-uploaded-layers-found")}</p>
		            ) : (
		              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
		                {/* Uploaded layer */}
		                <div className="space-y-2">
		                  <label className="block text-xs font-medium text-gray-600">{t("uploaded-layer")}</label>
		                  <select
		                    value={formData?.uploaded_layer_id ?? ''}
		                    onChange={e => handleInputChange('uploaded_layer_id', e.target.value || null)}
		                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
		                  >
		                    <option value="">{t("no-layer-selected")}</option>
		                    {userLayers.map(l => (
		                      <option key={l.layer_id} value={l.layer_id}>
		                        {l.title} ({l.records_count} pts)
		                      </option>
		                    ))}
		                  </select>
		                  {formData?.uploaded_layer_id && (
		                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
		                      <input
		                        type="checkbox"
		                        checked={formData?.use_uploaded_data_only ?? false}
		                        onChange={e => handleInputChange('use_uploaded_data_only', e.target.checked)}
		                        className="rounded"
		                      />
		                      {t("skip-map-categories-use-this-layers-data-only")}
		                    </label>
		                  )}
		                </div>
		                {/* Mandatory layer */}
		                <div className="space-y-2">
		                  <label className="block text-xs font-medium text-gray-600">{t("mandatory-layer")}</label>
		                  <select
		                    value={formData?.mandatory_layer_id ?? ''}
		                    disabled={formData?.num_groups > 1}
		                    onChange={e => handleInputChange('mandatory_layer_id', e.target.value || null)}
		                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white disabled:opacity-50 disabled:cursor-not-allowed"
		                  >
		                    <option value="">{t("no-layer-selected")}</option>
		                    {userLayers.map(l => (
		                      <option key={l.layer_id} value={l.layer_id}>
		                        {l.title} ({l.records_count} pts)
		                      </option>
		                    ))}
		                  </select>
		                  {formData?.num_groups > 1 && (
		                    <p className="text-xs text-amber-600 flex items-center gap-1">
		                      <FaExclamationTriangle className="w-3 h-3 flex-shrink-0" />
		                      {t("mandatory-layer-requires-1-van")}
		                    </p>
		                  )}
		                </div>
		              </div>
		            )}
		          </div>
		          <SetAttributeStep
		            onInputChange={handleAttributeChange}
		            inputCategories={categories}
		            formData={formData}
		          />
		          {/* Route Timing */}
		          <div className="border border-gray-200 rounded-xl p-4">
		            <h4 className="text-sm font-semibold text-gray-700 mb-4">{t("route-timing")}</h4>
		            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
		              <div className="space-y-1">
		                <label className="block text-xs font-medium text-gray-600">{t("work-hours-per-day")}</label>
		                <input
		                  type="number"
		                  value={(formData as unknown as Record<string, unknown>)['work_hours_per_day'] as number ?? ''}
		                  step={0.5}
		                  onChange={e => handleInputChange('work_hours_per_day', e.target.value === '' ? '' : Number(e.target.value))}
		                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
		                />
		              </div>
		              <div className="space-y-1">
		                <label className="block text-xs font-medium text-gray-600">{t("store-visit-minutes")}</label>
		                <input
		                  type="number"
		                  value={(formData as unknown as Record<string, unknown>)['store_visit_minutes'] as number ?? ''}
		                  step={1}
		                  onChange={e => handleInputChange('store_visit_minutes', e.target.value === '' ? '' : Number(e.target.value))}
		                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
		                />
		              </div>
		            </div>
		          </div>

		          {/* Excluded Keywords */}
		          <div className="border border-gray-200 rounded-xl p-4">
		            <h4 className="text-sm font-semibold text-gray-700 mb-1">{t("exclude-keywords")}</h4>
		            <p className="text-xs text-gray-500 mb-3">{t("exclude-keywords-hint")}</p>
		            <div className="flex flex-wrap gap-2 mb-2">
		              {(formData?.excluded_names ?? []).map((kw, i) => (
		                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-700 text-xs rounded-full">
		                  {kw}
		                  <button
		                    type="button"
		                    onClick={() => handleInputChange('excluded_names', (formData?.excluded_names ?? []).filter((_, j) => j !== i))}
		                    className="hover:text-red-900"
		                  >
		                    <FaTimes className="w-2.5 h-2.5" />
		                  </button>
		                </span>
		              ))}
		            </div>
		            <input
		              type="text"
		              value={excludeInput}
		              onChange={e => setExcludeInput(e.target.value)}
		              onPaste={e => {
		                const text = e.clipboardData.getData('text');
		                const parts = text
		                  .split(/[\n,]+/)
		                  .map(s => s.trim().replace(/^["']+|["']+$/g, ''))
		                  .filter(Boolean);
		                if (parts.length > 1) {
		                  e.preventDefault();
		                  handleInputChange('excluded_names', [
		                    ...(formData?.excluded_names ?? []),
		                    ...parts.map(s => `"${s}"`),
		                  ]);
		                  setExcludeInput('');
		                }
		              }}
		              onKeyDown={e => {
		                if ((e.key === 'Enter' || e.key === ',') && excludeInput.trim()) {
		                  e.preventDefault();
		                  const quoted = `"${excludeInput.trim()}"`;
		                  handleInputChange('excluded_names', [...(formData?.excluded_names ?? []), quoted]);
		                  setExcludeInput('');
		                }
		              }}
		              placeholder={t("exclude-keywords-hint")}
		              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
		            />
		          </div>

		          {/* Advanced Options */}
		          <div className="border border-gray-200 rounded-xl overflow-hidden">
		            <button
		              type="button"
		              onClick={() => setIsAdvancedOpen(v => !v)}
		              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors"
		            >
		              <span>{t("advanced-options")}</span>
		              <FaChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
		            </button>
		            {isAdvancedOpen && (
		              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
		                {ADVANCED_FORM_FIELDS.map(({ key, labelKey, step, ...rest }) => (
		                  <div key={key} className="space-y-1">
		                    <label className="block text-xs font-medium text-gray-600">{t(labelKey)}</label>
		                    <input
		                      type="number"
		                      value={(formData as unknown as Record<string, unknown>)[key] as number ?? ''}
		                      step={step}
		                      {...rest}
		                      onChange={e => handleInputChange(key, e.target.value === '' ? '' : Number(e.target.value))}
		                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
		                    />
		                  </div>
		                ))}
		              </div>
		            )}
		          </div>
				      <div className="flex-1 relative w-full h-full min-h-[800px]" id="map-container">
				        <div className="w-full h-full overflow-hidden [&_.ol-map]:size-full">
				        	<VrpMap formData={formData} handleInputChange={handleInputChange} />
							  </div>
				      </div>
            </div>
            <div className="flex items-center text-sm justify-center pb-4">
	            <button className="border-green-700 px-4 py-2 rounded border hover:enabled:text-white hover:enabled:bg-green-700 disabled:cursor-not-allowed disabled:border-gray-500 disabled:text-gray-500"
		            disabled={!formDataKeys.every(v => formData[v]) || !formData?.complementary_categories?.length || formData?.num_groups > 1}
		            onClick={async e => {
					          if(!e.target.parentElement.parentElement.reportValidity()) {
					          	return
					          }
					          setIsSubmitting(true)
					          try {
						          // console.log(123, formData);
						          const obj = Object.assign({}, formData);
						          obj.boolean_query = obj.complementary_categories.join(" OR ")
						          delete obj.complementary_categories
						          // Map frontend field names to backend contract
						          const polygon = obj.polygons;
						          (obj as Record<string, unknown>).polygon = polygon;
						          delete (obj as Record<string, unknown>).polygons;
						          obj.groups_info = (obj.groups_info ?? []).map((g: {lat: number|null; lng: number|null; phone: string}) => ({
						            driver_lat: g.lat,
						            driver_lng: g.lng,
						            driver_phone: g.phone,
						            driver_polygon: polygon,
						          }));
						          const newResp = await apiRequest({
							          url: urls.territory_design_vrp,
							          method: "POST",
							          body: obj,
					          }) as {status: number; data: {data: Record<string, string>}};
					          setResp(newResp.data.data);
						          if(newResp.status === 202) {
						          	setModalOpen(true);
						          }
					          } catch(e) {
				          	const msg = translateError(e, 'submission-failed');
				          	setSubmitError(msg);
				          	toast.error(msg);
					          }
					          setIsSubmitting(false)
				       }}>
		            {isSubmitting ? (
	              <span className="flex items-center gap-2">
	                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
	                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
	                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
	                </svg>
	                {t("submitting")}
	              </span>
	            ) : t("submit")}
	            </button>
	          </div>
            {/* Processing Status */}
            {isSubmitting && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ms-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{t("generating-your")}{' '}{businessType}{' '}{t("report")}</p>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{t("3-15-min")}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{t("report-generation-in-progress-you-can-always-find-the-report-link-in-your-profil")}</p>
                  </div>
                </div>
              </div>
            )}


            {/* Submit Error - Only show if not showing payment method form */}
            {submitError && !showPaymentMethodForm && (
              <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ms-3 flex-1">
                    {submitError.includes('|') ? (
                      <>
                        <h3 className="text-sm font-semibold text-red-800 mb-1">
                          {submitError.split('|')[0]}
                        </h3>
                        <p className="text-sm text-red-700">{submitError.split('|')[1]}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium">{submitError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {resp && resp.html_url &&
            (<div className="max-w-[900px] mx-auto w-full mb-4 bg-slate-100 p-8 rounded-xl">
            	<p className="text-2xl pb-8">{t("the-files-were-generated")}</p>
            	<div className="flex flex-col gap-4">
            	{REPORT_FILE_TYPES
            	.filter(({urlKey}) => resp[urlKey])
            	.map(({id, urlKey, icon}) => 
                (<p className="me-auto" key={id}>
	                <a className="flex items-center hover:underline text-lg cursor-pointer gap-2" href={resp[urlKey]} target="_blank" rel="noreferrer">
		                <img className="size-8" src={icon} />
		                <span>{t(id.replace("_", "-"))}</span>
	                </a>
                </p>))}
              </div>
            </div>)}
          </form>
        </div>
      </div>
      {resp &&
    	<Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contentClassName="max-w-4xl"
      	>
      	<span>Come back in { resp.detail && resp.detail.split(" ").slice(-2).join(" ") }, your data is being loaded.</span>
      </Modal>}
    </main>
  );
};

export default function VrpReportForm() {
		return <CustomReportForm />;
}
