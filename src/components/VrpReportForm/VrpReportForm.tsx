import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import Modal from '../common/Modal';

import { toast } from 'sonner';
import { FaArrowLeft, FaExclamationTriangle, FaChevronDown, FaDatabase, FaTimes, FaTruck } from 'react-icons/fa';
import {
  CustomReportData,
  FormErrors,
} from '../../types/allTypesAndInterfaces';

import { VrpReportData, UserLayer, DriverInfo, PolygonOpResponse } from '../../types/vrp';
import type { GeoJsonPolygon, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from '../../types/geojson';

// Import step components
import BasicInformationStep from './components/BasicInformationStep';
import SetAttributeStep from './components/AttributesStep';
import ZoneDefinitionStep from './components/ZoneDefinitionStep';

import {toLonLat, fromLonLat} from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import Control from 'ol/control/Control';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import GeoJSON from 'ol/format/GeoJSON';
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
.draw-control-D { top: 100px; inset-inline-start: .5em; }
.draw-control-W { top: 135px; inset-inline-start: .5em; }
.draw-control-R { top: 175px; inset-inline-start: .5em; }

.ol-control.draw-control,
.ol-control.draw-control-D,
.ol-control.draw-control-W,
.ol-control.draw-control-R {
  background: none;
  padding: 0;
}

.ol-control.draw-control button {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.7rem !important;
  font-weight: 600;
  padding: 6px 10px;
  font-family: inherit;
  background: white;
  color: #374151 !important;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  width: auto;
  height: auto;
  line-height: normal;
  text-indent: 0;
  letter-spacing: normal;
  margin: 0;
  min-width: 7rem;
}

.ol-control.draw-control button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.ol-control.draw-control.draw-control-active button {
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.25) !important;
}

/* Per-tool active colors — polygon uses driver color via dynamic style */
.draw-control-D.draw-control-active button {
  background: #f59e0b;
}
.draw-control-W.draw-control-active button {
  background: #ec4899;
}

/* Reset button */
.draw-control-R > button {
  color: #ef4444 !important;
}
.draw-control-R.draw-control-active > button {
  background: #ef4444 !important;
  color: white !important;
  border-color: transparent !important;
}
`;

/* ── Dynamic CSS for polygon draw-control active color ──────────────── */
const drawControlStyleTag = (color: string) => `
.draw-control-P.draw-control-active button { background: ${color} !important; }
`;

/* ── Multi-driver palette & helpers ──────────────────────────────────── */

const DRIVER_COLORS = [
  '#FF6600', // orange
  '#2563EB', // blue
  '#059669', // green
  '#7a028a', // purple
  '#DC2626', // red
  '#00ccff', // teal
  '#d9b206', // amber
  '#f718d2', // indigo
];

const emptyFeatureCollection = (): GeoJsonFeatureCollection => ({
  type: 'FeatureCollection' as const,
  features: [],
});

const makeDefaultDriver = (id: string, color: string): DriverInfo => ({
  id,
  lat: null,
  lng: null,
  phone: '',
  polygon: emptyFeatureCollection(),
  color,
  selectedDistrictIds: [],
});

/** Compute the centroid [lat, lng] of the first polygon in a FeatureCollection. */
const polygonCentroid = (fc: unknown): [number, number] | null => {
  const f = fc as { features?: Array<{ geometry?: { coordinates?: unknown } }> };
  const coords = f?.features?.[0]?.geometry?.coordinates;
  if (!coords || !Array.isArray(coords)) return null;
  // coords is [ring[...]] for Polygon, ring is [lng, lat][]
  const ring = (coords as number[][][])[0];
  if (!ring?.length) return null;
  let latSum = 0, lngSum = 0;
  for (const [lng, lat] of ring) { latSum += lat; lngSum += lng; }
  return [latSum / ring.length, lngSum / ring.length];
};

const MAPBOX_STREETS_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/512/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_KEY}`;

type FormInputValue = CustomReportData[keyof CustomReportData];


/* ── SVG icons for draw tools ─────────────────────────────────── */
const DRAW_ICONS: Record<string, string> = {
  P: `<svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="11,2 19,7 17,17 5,17 3,7"/></svg>`,
  D: `<svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="7" r="3.5"/><path d="M4 19c0-5 3.5-8.5 7-8.5s7 3.5 7 8.5"/></svg>`,
  W: `<svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 19V10l8-6 8 6v9"/><rect x="5" y="12" width="12" height="7" rx="1"/></svg>`,
};

const DRAW_LABELS: Record<string, string> = { P: 'Polygon', D: 'Driver', W: 'Warehouse' };

class DrawControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options?: { letter?: string; target?: HTMLElement }) {
    const options = opt_options || {};

    const letter = options.letter ?? '';
    const icon = DRAW_ICONS[letter] ?? '';
    const label = DRAW_LABELS[letter] ?? letter;

    const button = document.createElement('button');
    button.innerHTML = icon + '<span>' + label + '</span>';
    button.title = label;
    button.dataset.letter = letter;

    const element = document.createElement('div');
    element.className = 'draw-control ol-unselectable ol-control draw-control-' + letter;
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', function() {
      Array.from(document.querySelectorAll(".draw-control-active"))
        .forEach(v => element !== v && v.classList.remove("draw-control-active"));
      element.classList.toggle("draw-control-active");
      button.dispatchEvent(new CustomEvent("toggleDraw", {bubbles: true}))
    }, false);
  }
}

class ResetControl extends Control {
  constructor(opt_options?: { onClick: () => void; label: string; target?: HTMLElement }) {
    const options = opt_options || { onClick: () => {}, label: 'Reset' };

    const resetIcon = `<svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a7 7 0 0 1 13.2-3.5M18 11a7 7 0 0 1-13.2 3.5"/><path d="M17 3v4.5h-4.5M5 19v-4.5h4.5"/></svg>`;

    const button = document.createElement('button');
    button.innerHTML = resetIcon + '<span>' + options.label + '</span>';
    button.title = options.label;

    const element = document.createElement('div');
    element.className = 'draw-control ol-unselectable ol-control draw-control-R';
    element.appendChild(button);

    super({ element, target: options.target });

    button.addEventListener('click', options.onClick, false);
  }
}

const makeDrawStyle = (color: string) => new Style({
	stroke: new Stroke({color}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Circle({
		stroke: new Stroke({color}),
		fill: new Fill({color: "#FFFFFF7F"}),
		radius: 5,
	}),
});

const makeDriverStyle = (color: string) => new Style({
	image: new Icon({
		src: MapMarkerDriver,
		color: color,
	}),
});

const warehouseStyle = new Style({
	stroke: new Stroke({color: "magenta"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Icon({
		src: MapMarkerWarehouse,
	}),
});

type VrpMapDrawProps = {
  source: VectorSource;
  handleInputChange: (field: string, value: FormInputValue) => void;
  formData: VrpReportData | null;
  activeDriverId: string;
  activeDriverColor: string;
  onDrawPolygon: (fc: GeoJsonFeatureCollection) => void;
  onPolygonModified: (fc: GeoJsonFeatureCollection) => void;
  /** Called when a polygon is modified — routes to the feature's own driver */
  onPolygonModifiedForDriver: (driverId: string, fc: GeoJsonFeatureCollection) => void;
};

const cityCoords = {
	"Jeddah": [21.54333, 39.17278],
	"Riyadh": [24.6333333, 46.716667],
	"Mecca": [21.422510, 39.826168],
}
const VrpMapDraw = ({formData, source, handleInputChange, onDrawPolygon, onPolygonModified, onPolygonModifiedForDriver, activeDriverId, activeDriverColor}: VrpMapDrawProps) => {
  // Refs to avoid stale closures in event listeners — refs are always fresh
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const onDrawPolygonRef = useRef(onDrawPolygon);
  onDrawPolygonRef.current = onDrawPolygon;
  const onPolygonModifiedRef = useRef(onPolygonModified);
  onPolygonModifiedRef.current = onPolygonModified;
  const onPolygonModifiedForDriverRef = useRef(onPolygonModifiedForDriver);
  onPolygonModifiedForDriverRef.current = onPolygonModifiedForDriver;
  const handleInputChangeRef = useRef(handleInputChange);
  handleInputChangeRef.current = handleInputChange;
  const activeDriverIdRef = useRef(activeDriverId);
  activeDriverIdRef.current = activeDriverId;
  const activeDriverColorRef = useRef(activeDriverColor);
  activeDriverColorRef.current = activeDriverColor;
  const map = useMap();
  // Drawers recreated when activeDriverColor changes so the sketch style updates
  const [drawVersion, setDrawVersion] = useState(0);
  const [drawers] = useState(() => {
    const make = (color: string) => [
      new Draw({
        source: source,
        type: "Polygon",
        geometryName: "draw",
        style: makeDrawStyle(color),
      }),
      new Draw({
        source: source,
        type: "Point",
        geometryName: "driver",
        style: makeDriverStyle(color),
      }),
      new Draw({
        source: source,
        type: "Point",
        geometryName: "warehouse",
        style: warehouseStyle,
      }),
    ];
    return make(activeDriverColor);
  });

  // Recreate drawers when activeDriverColor changes — OpenLayers Draw
  // does not re-read the style option after construction.
  useEffect(() => {
    if (!map) return;
    // Remove old drawers from map
    drawers.forEach(d => map.removeInteraction(d));
    // Replace them with new ones in the same array slots
    const newDrawers = [
      new Draw({
        source,
        type: "Polygon",
        geometryName: "draw",
        style: makeDrawStyle(activeDriverColor),
      }),
      new Draw({
        source,
        type: "Point",
        geometryName: "driver",
        style: makeDriverStyle(activeDriverColor),
      }),
      new Draw({
        source,
        type: "Point",
        geometryName: "warehouse",
        style: warehouseStyle,
      }),
    ];
    // Swap in-place so the array reference is stable for event handlers
    drawers.length = 0;
    drawers.push(...newDrawers);
    // Re-add the currently active drawer if any
    if (draw > 0) map.addInteraction(drawers[draw - 1]);
    setDrawVersion(v => v + 1);
    return () => { drawers.forEach(d => map.removeInteraction(d)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDriverColor, source]);
  const [oldCity, setOldCity] = useState("");
  const [draw, setDraw] = useState(0);
  if(map && formData && oldCity != formData.city_name) {
    const city = formData.city_name;
    setOldCity(city);
    map.getView().setCenter(fromLonLat(([...(cityCoords as Record<string, number[]>)[city]] as number[]).reverse()));
  }

  // Restore saved polygon for the active driver, and keep other drivers' polygons visible.
  useEffect(() => {
    if (!map) return;
    const drivers = formData?.drivers ?? [];

    // Remove ALL draw/driver/warehouse features — we'll re-add from formData
    source.getFeatures()
      .filter(f => f.getGeometryName() === 'draw' || f.getGeometryName() === 'driver' || f.getGeometryName() === 'warehouse')
      .forEach(f => source.removeFeature(f));

    // Re-add all drivers' polygons (non-editable) and active driver's polygon (editable)
    drivers.forEach(d => {
      const fc = d.polygon;
      if (!fc?.features?.length) return;
      try {
        const features = new GeoJSON().readFeatures(fc, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });
        features.forEach(f => {
          const g = f.getGeometry();
          f.setGeometryName('draw');
          f.set('driverId', d.id);
          f.set('driverColor', d.color);
          if (g) f.setGeometry(g);
        });
        source.addFeatures(features);
      } catch { /* ignore malformed saved polygon */ }
    });

    // Re-add all drivers' points
    drivers.forEach(d => {
      if (d.lat == null || d.lng == null) return;
      try {
        const ptFeature = new GeoJSON().readFeature({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
          properties: {},
        }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }) as import('ol/Feature').default;
        const g = ptFeature.getGeometry();
        ptFeature.setGeometryName('driver');
        ptFeature.set('driverId', d.id);
        ptFeature.set('driverColor', d.color);
        if (g) ptFeature.setGeometry(g);
        source.addFeature(ptFeature);
      } catch { /* ignore */ }
    });

    // Re-add warehouse point from formData
    if (formData?.warehouse_lat != null && formData?.warehouse_lng != null) {
      try {
        const whFeature = new GeoJSON().readFeature({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [formData.warehouse_lng, formData.warehouse_lat] },
          properties: {},
        }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }) as import('ol/Feature').default;
        const whG = whFeature.getGeometry();
        whFeature.setGeometryName('warehouse');
        if (whG) whFeature.setGeometry(whG);
        source.addFeature(whFeature);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, formData?.drivers, activeDriverId, formData?.warehouse_lat, formData?.warehouse_lng]);

  // Modify interaction — allows dragging vertices/edges after drawing
  // Routes modifications to the driver that owns the feature (via driverId), not the active driver.
  useEffect(() => {
    if (!map) return;
    const modify = new Modify({ source });
    map.addInteraction(modify);
    modify.on('modifyend', (e) => {
      const fmt = new GeoJSON();

      // Collect all modified feature's driverIds that were touched
      const affectedDriverIds = new Set<string>();
      e.features.forEach(feature => {
        const feat = feature as unknown as { get: (k: string) => string | undefined; getGeometryName: () => string };
        if (feat.getGeometryName() === 'draw') {
          affectedDriverIds.add(feat.get('driverId') ?? activeDriverIdRef.current);
        }
      });

      // For each affected driver, rebuild their full FC from all their source features
      affectedDriverIds.forEach(driverId => {
        const driverFeatures = source.getFeatures().filter(f => {
          const feat = f as unknown as { getGeometryName: () => string; get: (k: string) => string | undefined };
          return feat.getGeometryName() === 'draw' && feat.get('driverId') === driverId;
        });

        const fc: GeoJsonFeatureCollection = {
          type: 'FeatureCollection',
          features: driverFeatures.map(f => {
            const geoJsonFeature = fmt.writeFeatureObject(f as never, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }) as { geometry: { type: string; coordinates: unknown } };
            return { type: 'Feature' as const, properties: {}, geometry: geoJsonFeature.geometry as unknown as GeoJsonGeometry };
          }),
        };

        if (driverId !== activeDriverIdRef.current) {
          onPolygonModifiedForDriverRef.current(driverId, fc);
        } else {
          onPolygonModifiedRef.current(fc);
        }
      });

      // Handle driver/warehouse point modifications
      e.features.forEach(feature => {
        const feat = feature as unknown as { get: (k: string) => string | undefined; getGeometryName: () => string; getGeometry: () => unknown };
        const name = feat.getGeometryName();
        if (name === 'driver') {
          const g = feat.getGeometry() as { getCoordinates: () => unknown };
          const coords = toLonLat((g.getCoordinates() as unknown) as number[]);
          // Use the feature's driverId to update the right driver's position
          const targetDriverId = driverId || activeDriverIdRef.current;
          handleInputChangeRef.current('updateDriverPosition', [
            targetDriverId, coords[1], coords[0],
          ] as unknown as FormInputValue);
        }
        else if (name === 'warehouse') { 
          const g = feat.getGeometry() as { getCoordinates: () => unknown };
          const coords = toLonLat((g.getCoordinates() as unknown) as number[]);
          handleInputChangeRef.current('warehouse_lat', coords[1]);
          handleInputChangeRef.current('warehouse_lng', coords[0]); }
      });
    });
    return () => { map.removeInteraction(modify); };
  }, [map, source]);

  useEffect(() => {
    const handleDrawEnd = (ev: { feature: unknown }) => {
      const feature = ev.feature as unknown as { set: (k: string, v: string) => void; getGeometryName: () => string; getGeometry: () => unknown; get: (k: string) => string };
      feature.set('driverId', activeDriverIdRef.current);
      feature.set('driverColor', activeDriverColorRef.current);
      const name = feature.getGeometryName();
      if (name === "draw") {
        const geom = feature.getGeometry() as unknown as { getCoordinates: () => number[][][] };
        const tmpCoords = geom.getCoordinates()[0].map(v => toLonLat(v));
        const newFC: GeoJsonFeatureCollection = {
          type: 'FeatureCollection' as const,
          features: [{ type: 'Feature' as const, properties: {}, geometry: { coordinates: [tmpCoords], type: 'Polygon' as const } }],
        };
        onDrawPolygonRef.current(newFC);
      } else if (name === "driver") {
        const geom = feature.getGeometry() as unknown as { getCoordinates: () => number[] };
        const tmpCoords = toLonLat(geom.getCoordinates());
        handleInputChangeRef.current('updateDriverPosition', [
          activeDriverIdRef.current, tmpCoords[1], tmpCoords[0],
        ] as unknown as FormInputValue);
      } else if (name === "warehouse") {
        const geom = feature.getGeometry() as unknown as { getCoordinates: () => number[] };
        const tmpCoords = toLonLat(geom.getCoordinates());
        handleInputChangeRef.current("warehouse_lat", tmpCoords[1]);
        handleInputChangeRef.current("warehouse_lng", tmpCoords[0]);
      }
    };
    const drawStartHandlers: Array<(ev: unknown) => void> = [];
    drawers.forEach((v) => {
      v.on("drawend", handleDrawEnd);
      const startHandler = () => {
        // No-op: new polygons are unioned with the canonical FC, not replacing it
      };
      v.on("drawstart", startHandler);
      drawStartHandlers.push(startHandler);
    });
    return () => {
      drawers.forEach((v, i) => {
        v.un("drawend", handleDrawEnd);
        v.un("drawstart", drawStartHandlers[i]);
      });
    };
  }, [drawers, source, drawVersion]);

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
  }, [draw, drawers, map, drawVersion]);

  return null;
};

const VrpMap = ({formData, handleInputChange, onDrawPolygon, onPolygonModified, onPolygonModifiedForDriver, activeDriverId, activeDriverColor, onResetAllPolygons}: { formData: VrpReportData | null; handleInputChange: VrpMapDrawProps['handleInputChange']; onDrawPolygon: VrpMapDrawProps['onDrawPolygon']; onPolygonModified: VrpMapDrawProps['onPolygonModified']; onPolygonModifiedForDriver: VrpMapDrawProps['onPolygonModifiedForDriver']; activeDriverId: string; activeDriverColor: string; onResetAllPolygons?: () => void }) => {
  const mapRef = useRef<import('ol/Map').default | null>(null);
  // Focus the map target on hover so scroll/pan work without clicking first
  const handleMapHover = useCallback(() => {
    mapRef.current?.getTargetElement()?.focus();
  }, []);
  // Stable source — must not be recreated on every render
  const [drawSource] = useState(() => new VectorSource({ wrapX: false }));
  const [panelOpen, setPanelOpen] = useState(false);
  const [geoJsonText, setGeoJsonText] = useState('');
  const [geoJsonError, setGeoJsonError] = useState('');
  const onResetAllPolygonsRef = useRef(onResetAllPolygons);
  onResetAllPolygonsRef.current = onResetAllPolygons;

  // Stable wrapper — never changes identity, always delegates to the ref
  const [stableReset] = useState(() => () => onResetAllPolygonsRef.current?.());

  const openPanel = () => {
    const current = formData?.drivers?.find(d => d.id === activeDriverId)?.polygon;
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
        f.set('driverId', activeDriverId);
        f.set('driverColor', activeDriverColor);
        if (geometry) f.setGeometry(geometry);
      });
      // Remove only the active driver's draw features, keep others
      drawSource.getFeatures().filter(f => f.getGeometryName() === 'draw' && f.get('driverId') === activeDriverId).forEach(f => drawSource.removeFeature(f));
      drawSource.addFeatures(features);
      // Normalise to FeatureCollection for formData and trigger backend normalize
      const fc: GeoJsonFeatureCollection = type === 'FeatureCollection' ? parsed as GeoJsonFeatureCollection : {
        type: 'FeatureCollection',
        features: type === 'Feature' ? [parsed as GeoJsonFeature] : [{ type: 'Feature', properties: {}, geometry: parsed as GeoJsonPolygon }],
      };
      // Use onDrawPolygon (not handleInputChange) so the normalize endpoint is called
      onDrawPolygon(fc);
      setPanelOpen(false);
    } catch (err) {
      setGeoJsonError(`${t("could-not-parse-geometry")}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div
      className="relative w-full h-full"
      tabIndex={-1}
      onMouseEnter={handleMapHover}
      style={{ outline: 'none' }}
    >
      <style>{DRAW_CONTROL_STYLE}</style>
      <style>{drawControlStyleTag(activeDriverColor)}</style>
      <style>{`[class*="ol-map"]:focus, .ol-viewport:focus { outline: none; }`}</style>
      <Map ref={mapRef}controls={defaultControls().extend([
        ...["P", "D", "W"].map(v => new DrawControl({ letter: v })),
        ...(onResetAllPolygons
          ? [new ResetControl({ onClick: stableReset, label: t("reset") })]  // ← stableReset
          : []),
      ])}>
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
            const feat = feature as unknown as { getGeometryName: () => string; get: (k: string) => string | undefined };
            const name = feat.getGeometryName();
            const color = feat.get('driverColor');
            if (name === "draw") return makeDrawStyle(color ?? '#666');
            if (name === "driver") return makeDriverStyle(color ?? '#666');
            if (name === "warehouse") return warehouseStyle;
            return undefined;
          }}
        />
        <VrpMapDraw formData={formData} source={drawSource} handleInputChange={handleInputChange} onDrawPolygon={onDrawPolygon} onPolygonModified={onPolygonModified} onPolygonModifiedForDriver={onPolygonModifiedForDriver} activeDriverId={activeDriverId} activeDriverColor={activeDriverColor} />
        <View center={fromLonLat(([...(cityCoords as Record<string, number[]>)[formData?.city_name ?? 'Riyadh']] as number[]).reverse())} zoom={13} />
      </Map>

      {/* GeoJSON paste panel toggle button — top-right inside map */}
      <button
        type="button"
        onClick={panelOpen ? () => setPanelOpen(false) : openPanel}
        title={t("paste-geojson-polygon")}
        className="absolute top-3 right-3 z-10 bg-white border border-gray-300 rounded-lg shadow px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
      >
        <span className="font-mono text-primary">&#123;&#125;</span>
        {panelOpen ? t("close") : 'GeoJSON'}
      </button>

      {/* GeoJSON paste panel — drops down from top-right */}
      {panelOpen && (
        <div className="absolute top-11 right-3 z-10 w-72 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
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

const formDataKeys = ["warehouse_lat", "warehouse_lng", "manager_phone", "num_groups", "country_name", "city_name", "user_id"];

const INITIAL_VRP_FORM_DATA: Omit<VrpReportData, 'user_id'> & { user_id?: string } = {
  "city_name": "Riyadh",
  "country_name": "Saudi Arabia",
  "user_id": undefined,
  "drivers": [makeDefaultDriver('d0', DRIVER_COLORS[0])],
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
 
  // Multi-driver: track which driver is currently being edited
  const [activeDriverIndex, setActiveDriverIndex] = useState(0);
  const activeDriverId = formData?.drivers?.[activeDriverIndex]?.id ?? 'd0';
  const activeDriverColor = formData?.drivers?.[activeDriverIndex]?.color ?? DRIVER_COLORS[0];

  // Clamp activeDriverIndex when drivers list shrinks
  useEffect(() => {
    const len = formData?.drivers?.length ?? 0;
    if (len > 0 && activeDriverIndex >= len) {
      setActiveDriverIndex(len - 1);
    }
  }, [formData?.drivers?.length, activeDriverIndex]);

  // Add a new driver
  const addDriver = useCallback(() => {
  setFormData(prev => {
    if (!prev) return null;
    const usedColors = new Set(prev.drivers.map(d => d.color));
    const nextColor = DRIVER_COLORS.find(c => !usedColors.has(c)) ?? DRIVER_COLORS[0];
    return {
      ...prev,
      drivers: [...prev.drivers, makeDefaultDriver(`d${Date.now()}`, nextColor)],
    };
  });
  setActiveDriverIndex(prev => prev + 1);
}, []);

  // Remove a driver (min 1)
  const removeDriver = useCallback((idx: number) => {
    setFormData(prev => {
      if (!prev || prev.drivers.length <= 1) return prev;
      return { ...prev, drivers: prev.drivers.filter((_, i) => i !== idx) };
    });
    setActiveDriverIndex(prev => {
      if (idx <= prev) return Math.max(0, prev - 1);
      return prev;
    });
  }, []);

  // Reset all polygons and selected districts across all drivers
  const resetAllPolygons = useCallback(() => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        drivers: prev.drivers.map(d => ({ ...d, polygon: emptyFeatureCollection(), selectedDistrictIds: [] })),
      };
    });
  }, []);

  // Update a specific driver's field
  const updateDriver = useCallback((driverIdx: number, field: keyof DriverInfo, value: DriverInfo[keyof DriverInfo]) => {
    setFormData(prev => {
      if (!prev) return null;
      const newDrivers = prev.drivers.map((d, i) => i === driverIdx ? { ...d, [field]: value } : d);
      return { ...prev, drivers: newDrivers };
    });
  }, []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [resp, setResp] = useState<Record<string, string> | null>(null);
  const [allDriverResults, setAllDriverResults] = useState<Array<{ driverLabel: string; color: string; resp: Record<string, string> }> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [excludeInput, setExcludeInput] = useState('');
  const [polygonOpInProgress, setPolygonOpInProgress] = useState(false);

  // Payment method state
  const [showPaymentMethodForm, ] = useState(false);

  // ── Polygon operation API helpers ─────────────────────────────────────
  const callNormalize = useCallback(async (fc: GeoJsonFeatureCollection): Promise<GeoJsonFeatureCollection> => {
    setPolygonOpInProgress(true);
    try {
      const res = await apiRequest({
        url: urls.polygon_normalize,
        method: 'POST',
        body: { polygons: fc },
      }) as { data?: { data?: PolygonOpResponse } };
      const result = res?.data?.data;
      if (result?.features) {
        return {
          type: 'FeatureCollection',
          features: result.features.map(f => ({
            type: 'Feature' as const,
            properties: (f.properties ?? {}) as Record<string, unknown>,
            geometry: f.geometry as GeoJsonGeometry,
          })),
        };
      }
      return fc;
    } catch {
      return fc;
    } finally {
      setPolygonOpInProgress(false);
    }
  }, []);

  const callAddDistrict = useCallback(async (districtId: number): Promise<GeoJsonFeatureCollection | null> => {
    const driver = formData?.drivers?.[activeDriverIndex];
    if (!driver) return null;
    setPolygonOpInProgress(true);
    try {
      const res = await apiRequest({
        url: urls.polygon_add_district,
        method: 'POST',
        body: {
          polygons: driver.polygon,
          country_name: formData?.country_name ?? 'Saudi Arabia',
          city_name: formData?.city_name ?? 'Riyadh',
          district_id: districtId,
        },
      }) as { data?: { data?: PolygonOpResponse } };
      const result = res?.data?.data;
      if (result?.features) {
        return {
          type: 'FeatureCollection',
          features: result.features.map(f => ({
            type: 'Feature' as const,
            properties: (f.properties ?? {}) as Record<string, unknown>,
            geometry: f.geometry as GeoJsonGeometry,
          })),
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      setPolygonOpInProgress(false);
    }
  }, [formData, activeDriverIndex]);

  const callSubtractDistrict = useCallback(async (districtId: number): Promise<GeoJsonFeatureCollection | null> => {
    const driver = formData?.drivers?.[activeDriverIndex];
    if (!driver) return null;
    setPolygonOpInProgress(true);
    try {
      const res = await apiRequest({
        url: urls.polygon_subtract_district,
        method: 'POST',
        body: {
          polygons: driver.polygon,
          country_name: formData?.country_name ?? 'Saudi Arabia',
          city_name: formData?.city_name ?? 'Riyadh',
          district_id: districtId,
        },
      }) as { data?: { data?: PolygonOpResponse } };
      const result = res?.data?.data;
      if (result?.features) {
        return {
          type: 'FeatureCollection',
          features: result.features.map(f => ({
            type: 'Feature' as const,
            properties: (f.properties ?? {}) as Record<string, unknown>,
            geometry: f.geometry as GeoJsonGeometry,
          })),
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      setPolygonOpInProgress(false);
    }
  }, [formData, activeDriverIndex]);
  
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

  // Keep num_groups in sync with the number of drivers
  useEffect(() => {
    if (!formData) return;
    const driverCount = formData.drivers?.length ?? 0;
    if (formData.num_groups !== driverCount && driverCount > 0) {
      setFormData(prev => prev ? { ...prev, num_groups: driverCount } : null);
    }
  }, [formData?.drivers?.length, formData]);



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
    setFormData(prev => {
      if (!prev) return null;
      // Route driver position changes by driverId (from modify on non-active driver)
      if (field === 'updateDriverPosition') {
        const [driverId, lat, lng] = value as unknown as [string, number, number];
        return {
          ...prev,
          drivers: prev.drivers.map(d =>
            d.id === driverId ? { ...d, lat, lng } : d
          ),
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });

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

  // ── Normalize helper: call backend then update driver's polygon ────────
  const normalizeAndUpdate = useCallback(async (driverIdx: number, rawFC: GeoJsonFeatureCollection) => {
    const cleaned = await callNormalize(rawFC);
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        drivers: prev.drivers.map((d, i) =>
          i === driverIdx ? { ...d, polygon: cleaned } : d
        ),
      };
    });
  }, [callNormalize]);

  // ── Called when user draws a polygon on the map ────────────────────────
  const handleDrawPolygon = useCallback((drawnFC: GeoJsonFeatureCollection) => {
    // Union the new geometry with the driver's existing canonical FC
    const existingFC = formData?.drivers?.[activeDriverIndex]?.polygon ?? emptyFeatureCollection();
    const combined: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: [...(existingFC.features ?? []), ...(drawnFC.features ?? [])],
    };
    normalizeAndUpdate(activeDriverIndex, combined);
  }, [activeDriverIndex, normalizeAndUpdate, formData?.drivers]);

  // ── Called when user modifies a polygon on the map ─────────────────────
  const handlePolygonModified = useCallback((modifiedFC: GeoJsonFeatureCollection) => {
    normalizeAndUpdate(activeDriverIndex, modifiedFC);
  }, [activeDriverIndex, normalizeAndUpdate]);

  // ── Called when a NON-ACTIVE driver's polygon is modified ─────────────
  const handlePolygonModifiedForDriver = useCallback((driverId: string, modifiedFC: GeoJsonFeatureCollection) => {
    setFormData(prev => {
      if (!prev) return null;
      const driverIdx = prev.drivers.findIndex(d => d.id === driverId);
      if (driverIdx === -1) return prev;
      normalizeAndUpdate(driverIdx, modifiedFC);
      return prev;
    });
  }, [normalizeAndUpdate]);

  // ── Called when user clicks + on a district ────────────────────────────
  const handleAddDistrict = useCallback(async (districtId: number) => {
    const result = await callAddDistrict(districtId);
    if (result) {
      setFormData(prev => {
        if (!prev) return null;
        const driver = prev.drivers[activeDriverIndex];
        const newSelected = [...(driver.selectedDistrictIds ?? []), districtId];
        return {
          ...prev,
          drivers: prev.drivers.map((d, i) =>
            i === activeDriverIndex ? { ...d, polygon: result, selectedDistrictIds: newSelected } : d
          ),
        };
      });
    }
  }, [callAddDistrict, activeDriverIndex]);

  // ── Called when user clicks - on a district ────────────────────────────
  const handleSubtractDistrict = useCallback(async (districtId: number) => {
    const result = await callSubtractDistrict(districtId);
    if (result) {
      setFormData(prev => {
        if (!prev) return null;
        const driver = prev.drivers[activeDriverIndex];
        const newSelected = (driver.selectedDistrictIds ?? []).filter(id => id !== districtId);
        return {
          ...prev,
          drivers: prev.drivers.map((d, i) =>
            i === activeDriverIndex ? { ...d, polygon: result, selectedDistrictIds: newSelected } : d
          ),
        };
      });
    }
  }, [callSubtractDistrict, activeDriverIndex]);

  
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
		                    disabled={false}
		                    onChange={e => handleInputChange('mandatory_layer_id', e.target.value || null)}
		                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
		                  >
		                    <option value="">{t("no-layer-selected")}</option>
		                    {userLayers.map(l => (
		                      <option key={l.layer_id} value={l.layer_id}>
		                        {l.title} ({l.records_count} pts)
		                      </option>
		                    ))}
		                  </select>
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
		          {/* ── Two-column layout: Driver + Zone on left, Map on right */}
		          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
		            {/* Left column — Driver Management + Zone Definition as one unified step */}
		            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
		              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
		                <FaTruck className="w-4 h-4 text-primary" />
		                {t("drivers")} ({formData?.drivers?.length ?? 0})
		              </h4>
		              {/* Driver tabs */}
		              <div className="flex flex-wrap items-center gap-2">
		                {formData?.drivers?.map((driver, idx) => (
		                  <div key={driver.id} className="flex items-center">
		                    <button
		                      type="button"
		                      onClick={() => setActiveDriverIndex(idx)}
		                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
		                        idx === activeDriverIndex
		                          ? 'border-gray-800 bg-gray-100 shadow-sm'
		                          : 'border-gray-200 bg-white hover:border-gray-300'
		                      }`}
		                    >
		                      <span
		                        className="w-3 h-3 rounded-full flex-shrink-0"
		                        style={{ backgroundColor: driver.color }}
		                      />
		                      <span>{t("driver")} {idx + 1}</span>
		                      {driver.polygon?.features?.length > 0 && (
		                        <span className="text-green-600">●</span>
		                      )}
		                    </button>
		                    {formData.drivers.length > 1 && (
		                      <button
		                        type="button"
		                        onClick={() => removeDriver(idx)}
		                        className="ms-1 p-1 text-gray-400 hover:text-red-500 rounded"
		                        title={t("remove-driver")}
		                      >
		                        <FaTimes className="w-3 h-3" />
		                      </button>
		                    )}
		                  </div>
		                ))}
		                <button
		                  type="button"
		                  onClick={addDriver}
		                  disabled={(formData?.drivers?.length ?? 0) >= DRIVER_COLORS.length}
		                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border-2 border-dashed border-gray-300 bg-white text-gray-500 hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
		                >
		                  + {t("add-driver")}
		                </button>
		              </div>
		              {/* Active driver phone */}
		              <div className="flex items-center gap-2">
		                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
		                  {t("phone")}
		                </label>
		                <input
		                  type="tel"
		                  value={formData?.drivers?.[activeDriverIndex]?.phone ?? ''}
		                  onChange={e => updateDriver(activeDriverIndex, 'phone', e.target.value)}
		                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
		                  placeholder={t("phone-number")}
		                />
		              </div>
		              {/* Hint */}
		              <p className="text-xs text-gray-400 italic">
		                {t("draw-polygon-hint")} {t("each-driver-needs-own-polygon")}
		              </p>

		              {/* Zone Definition — add/remove districts with +/- buttons */}
		              <ZoneDefinitionStep
		                cityName={formData?.city_name ?? ''}
		                countryName={formData?.country_name ?? 'Saudi Arabia'}
		                disabled={isSubmitting}
		                selectedDistrictIds={formData?.drivers?.[activeDriverIndex]?.selectedDistrictIds}
		                onAddDistrict={handleAddDistrict}
		                onSubtractDistrict={handleSubtractDistrict}
		                isPolygonOpInProgress={polygonOpInProgress}
		              />
		            </div>
		            {/* Right column: Map */}
		            <div className="relative w-full h-full min-h-[500px] col-span-2" id="map-container">
				        <div className="w-full h-full overflow-hidden [&_.ol-map]:size-full">
				        	<VrpMap formData={formData} handleInputChange={handleInputChange} onDrawPolygon={handleDrawPolygon} onPolygonModified={handlePolygonModified} onPolygonModifiedForDriver={handlePolygonModifiedForDriver} activeDriverId={activeDriverId} activeDriverColor={activeDriverColor} onResetAllPolygons={resetAllPolygons} />
							  </div>
				      </div>
            </div>
            </div>
            <div className="flex items-center text-sm justify-center pb-4">
	            <button className="border-green-700 px-4 py-2 rounded border hover:enabled:text-white hover:enabled:bg-green-700 disabled:cursor-not-allowed disabled:border-gray-500 disabled:text-gray-500"
		            disabled={
                  !formDataKeys.every(v => (formData as unknown as Record<string, unknown>)[v]) ||
                  !formData?.drivers?.every(d => d.polygon?.features?.length > 0) ||
                  !formData?.complementary_categories?.length ||
                  isSubmitting
                }
		            onClick={async e => {
                  const btn = e.target as HTMLButtonElement;
                  const form = btn.closest('form');
                  if (form && !form.reportValidity()) return;

					        setIsSubmitting(true);
                    setSubmitError(null);
                    // Clear previous reports — only from prior submissions, not current
                    setAllDriverResults(null);
                    setResp(null);
                    const allResults: Array<{ driverLabel: string; color: string; resp: Record<string, string> }> = [];

                    try {
                      const drivers = formData?.drivers ?? [];

                      for (let di = 0; di < drivers.length; di++) {
                        const driver = drivers[di];

                        // Fall back to polygon centroid for any null driver position
                        const centroid = polygonCentroid(driver.polygon);
                        const fallbackLat = driver.lat ?? centroid?.[0] ?? 24.6333333;
                        const fallbackLng = driver.lng ?? centroid?.[1] ?? 46.716667;

                        // Build an explicit per-driver payload — never spread formData so no
                        // other drivers' polygons, legacy fields, or client-only fields leak in.
                        const obj = {
                          city_name:                  formData!.city_name,
                          country_name:               formData!.country_name,
                          user_id:                    formData!.user_id,
                          boolean_query:              (formData!.complementary_categories as unknown as string[]).join(" OR "),
                          excluded_names:             formData!.excluded_names,
                          num_groups:                 1,
                          num_work_days:              formData!.num_work_days,
                          departure_hour:             (formData as unknown as Record<string, unknown>).departure_hour,
                          osrm_multiplier:            (formData as unknown as Record<string, unknown>).osrm_multiplier,
                          work_hours_per_day:         (formData as unknown as Record<string, unknown>).work_hours_per_day,
                          store_visit_minutes:        (formData as unknown as Record<string, unknown>).store_visit_minutes,
                          current_daily_km_per_van:   formData!.current_daily_km_per_van,
                          weekly_refill_sar:          formData!.weekly_refill_sar,
                          current_stores_per_day:     formData!.current_stores_per_day,
                          driver_monthly_salary_sar:  formData!.driver_monthly_salary_sar,
                          planner_monthly_salary_sar: formData!.planner_monthly_salary_sar,
                          work_days_per_week:         formData!.work_days_per_week,
                          work_days_per_month:        formData!.work_days_per_month,
                          avg_revenue_per_store_sar:  formData!.avg_revenue_per_store_sar,
                          revenue_period_days:        formData!.revenue_period_days,
                          manager_phone:              formData!.manager_phone,
                          mandatory_layer_id:         formData!.mandatory_layer_id,
                          uploaded_layer_id:          formData!.uploaded_layer_id,
                          use_uploaded_data_only:     formData!.use_uploaded_data_only,
                          // Per-driver fields — only this driver's polygon and position
                          polygon:                    driver.polygon,
                          warehouse_lat:              formData!.warehouse_lat ?? fallbackLat,
                          warehouse_lng:              formData!.warehouse_lng ?? fallbackLng,
                          groups_info: [{
                            driver_lat:     fallbackLat,
                            driver_lng:     fallbackLng,
                            driver_phone:   driver.phone ?? '',
                            driver_polygon: driver.polygon,
                          }],
                        };

                        const newResp = await apiRequest({
                          url: urls.territory_design_vrp,
                          method: "POST",
                          body: obj,
                        }) as { status: number; data: { data: Record<string, string> } };

                        allResults.push({
                          driverLabel: `${t("driver")} ${di + 1}`,
                          color: driver.color,
                          resp: newResp.data.data,
                        });
                      }

                      // Store all results
                      setAllDriverResults(allResults);
                      setModalOpen(true);
                    } catch (e) {
                      const msg = translateError(e, 'submission-failed');
                      setSubmitError(msg);
                      toast.error(msg);
                    }
                    setIsSubmitting(false);
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
                      <p className="text-sm font-medium text-gray-900">{t("generating-routes")}</p>
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
            {allDriverResults && allDriverResults.length > 0 &&
            (<div className="max-w-[900px] mx-auto w-full mb-4 bg-slate-100 p-8 rounded-xl">
            	<p className="text-2xl pb-8">{t("the-files-were-generated")}</p>
              {/* Per-driver result tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {allDriverResults.map((dr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResp(dr.resp)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      resp === dr.resp ? 'border-gray-800 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dr.color }} />
                    {dr.driverLabel}
                  </button>
                ))}
              </div>
              {/* Active driver's report files */}
              {resp && (
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
              )}
            </div>)}
          </form>
        </div>
      </div>
      {allDriverResults &&
    	<Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contentClassName="max-w-4xl"
      	>
      	<span>{t("your-reports-are-ready")}</span>
      </Modal>}
    </main>
  );
};

export default function VrpReportForm() {
		return <CustomReportForm />;
}
