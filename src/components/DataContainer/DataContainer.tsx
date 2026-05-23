import { useState, useEffect, useMemo, useRef } from 'react';
import { FiCheckCircle, FiFileText, FiUploadCloud } from 'react-icons/fi';
import CatalogueCard from '../CatalogueCard/CatalogueCard';
import urls from '../../urls.json';
import { Catalog, UserLayer, CardItem } from '../../types/allTypesAndInterfaces';
import { useCatalogContext } from '../../context/CatalogContext';
import UserLayerCard from '../UserLayerCard/UserLayerCard';
import { isValidColor } from '../../utils/helperFunctions';
import { useAuth } from '../../context/AuthContext';
import { useUIContext } from '../../context/UIContext';
import apiRequest from '../../services/apiRequest';
import { useLayerContext } from '../../context/LayerContext';
import CampaignPage from '../../pages/Campaign/campaign_home';
import { Spinner } from '../common';
import { t } from '../../i18n';
import { translateApiMessage } from '../../utils/apiMessages';
import { LayerUploadFormData, MappingKey, UploadedLayerFeature } from '../../types';

import Modal from '../common/Modal';

const initialLayerUploadFormData: LayerUploadFormData = {
  title: '',
  file: null,
  delete_after_days: '30',
  points_color: '#1d9e75',
  deduplicate: false,
  name_column: '',
  lat_column: '',
  lon_column: '',
};

const normalizeColumnName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s_\-./()]+/g, '')
    .trim();

const columnMatchers: Record<MappingKey, string[]> = {
  name_column: [
    'name',
    'customername',
    'clientname',
    'storename',
    'branchname',
    'title',
    'اسم',
    'الاسم',
    'اسمالعميل',
    'اسمالفرع',
    'اسمالمتجر',
  ],
  lat_column: ['lat', 'latitude', 'y', 'خطالعرض', 'العرض', 'دائرةالعرض'],
  lon_column: [
    'lon',
    'lng',
    'long',
    'longitude',
    'x',
    'خطالطول',
    'الطول',
    'خطالطولالجغرافي',
  ],
};

const findBestColumnMatch = (headers: string[], key: MappingKey) => {
  const normalizedHeaders = headers.map(header => ({
    original: header,
    normalized: normalizeColumnName(header),
  }));

  return (
    normalizedHeaders.find(header => columnMatchers[key].includes(header.normalized))?.original ||
    normalizedHeaders.find(header =>
      columnMatchers[key].some(match => header.normalized.includes(match))
    )?.original ||
    ''
  );
};

const hasValidPointCoordinates = (feature: UploadedLayerFeature) => {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return false;

  const [longitude, latitude] = coordinates;
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

const parseCsvHeaders = (text: string) => {
  const firstLine = text.split(/\r?\n/).find(line => line.trim().length > 0) || '';
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < firstLine.length; index += 1) {
    const char = firstLine[index];
    const nextChar = firstLine[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  headers.push(current.trim());
  return headers.filter(Boolean);
};

const extractJsonHeaders = (text: string) => {
  const data = JSON.parse(text);
  const firstRow = Array.isArray(data)
    ? data[0]
    : data?.features?.[0]?.properties || data?.data?.[0] || data;

  if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) {
    return [];
  }

  const headers = Object.keys(firstRow);
  if (data?.type === 'FeatureCollection') {
    return Array.from(new Set([...headers, 'lat', 'lon', 'lng']));
  }

  return headers;
};

const extractFileHeaders = async (file: File) => {
  const text = await file.text();
  const filename = file.name.toLowerCase();

  if (filename.endsWith('.json')) {
    return extractJsonHeaders(text);
  }

  if (filename.endsWith('.csv')) {
    return parseCsvHeaders(text);
  }

  return [];
};

const getLayerTitleFromFilename = (filename: string) =>
  filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();

function LayerColumnSelect({
  label,
  value,
  headers,
  onChange,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-right">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
        value={value}
        onChange={event => onChange(event.target.value)}
        required
      >
        <option value="">{t("choose-column")}</option>
        {headers.map(header => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </label>
  );
}

function LayerUploadModal({
  open,
  onOpenChange,
  userId,
  onSubmit,
  submitting,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onSubmit: (body: FormData) => Promise<void>;
  submitting: boolean;
  errorMessage: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<LayerUploadFormData>(initialLayerUploadFormData);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [titleWasEdited, setTitleWasEdited] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData(initialLayerUploadFormData);
      setHeaders([]);
      setFileError('');
      setIsDragging(false);
      setTitleWasEdited(false);
    }
  }, [open]);

  const hasMapping = Boolean(formData.name_column && formData.lat_column && formData.lon_column);
  const canSubmit = Boolean(userId && formData.title.trim() && formData.file && hasMapping);

  const selectedFileLabel = useMemo(() => {
    if (!formData.file) return t("no-file-selected");
    return `${formData.file.name} · ${headers.length} ${t("columns")}`;
  }, [formData.file, headers.length]);

  const updateFormValue = <K extends keyof LayerUploadFormData>(
    key: K,
    value: LayerUploadFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const applyFile = async (file?: File) => {
    if (!file) return;

    setFileError('');
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.json')) {
      setFileError(t("upload-csv-or-json-file"));
      setHeaders([]);
      updateFormValue('file', null);
      return;
    }

    try {
      const nextHeaders = await extractFileHeaders(file);
      if (!nextHeaders.length) {
        setFileError(t("no-columns-found-in-file"));
        setHeaders([]);
        updateFormValue('file', file);
        return;
      }

      setHeaders(nextHeaders);
      setFormData(prev => ({
        ...prev,
        file,
        title: titleWasEdited ? prev.title : getLayerTitleFromFilename(file.name),
        name_column: findBestColumnMatch(nextHeaders, 'name_column'),
        lat_column: findBestColumnMatch(nextHeaders, 'lat_column'),
        lon_column: findBestColumnMatch(nextHeaders, 'lon_column'),
      }));
    } catch (error) {
      console.error(error);
      setFileError(t("could-not-read-file-columns"));
      setHeaders([]);
      updateFormValue('file', file);
    }
  };

  const buildFormData = () => {
    const body = new FormData();
    body.append('user_id', userId || '');
    body.append('title', formData.title.trim());
    body.append('file', formData.file as File);
    body.append('delete_after_days', formData.delete_after_days || '30');
    body.append('points_color', formData.points_color);
    body.append('deduplicate', String(formData.deduplicate));
    body.append('name_column', formData.name_column);
    body.append('lat_column', formData.lat_column);
    body.append('lon_column', formData.lon_column);
    return body;
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="max-w-4xl bg-white p-0 text-gray-900"
    >
      <form
        className="flex max-h-[82vh] flex-col overflow-hidden text-right"
        dir="rtl"
        onSubmit={async event => {
          event.preventDefault();
          if (!canSubmit || submitting) return;
          await onSubmit(buildFormData());
        }}
      >
        <div className="border-b border-gray-200 px-7 py-5">
          <h3 className="text-2xl font-bold text-gray-900">{t("layers")}</h3>
        </div>

        <div className="space-y-6 overflow-y-auto px-7 py-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#315d9e] px-3 py-1 text-xs font-semibold text-[#cfe0ff]">
                CSV أو JSON
              </span>
              <span className="text-sm font-semibold text-gray-700">{t("file")}</span>
            </div>

            <button
              type="button"
              className={`flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-5 text-center transition ${
                isDragging
                  ? 'border-[#1d9e75] bg-[#1d9e75]/10'
                  : 'border-gray-300 bg-gray-50 hover:border-[#1d9e75]/80'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={event => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={event => {
                event.preventDefault();
                setIsDragging(false);
                void applyFile(event.dataTransfer.files?.[0]);
              }}
            >
              {formData.file ? (
                <FiFileText className="h-9 w-9 text-[#1d9e75]" />
              ) : (
                <FiUploadCloud className="h-10 w-10 text-gray-500" />
              )}
              <span className="text-base font-semibold text-gray-700">
                {formData.file ? selectedFileLabel : t("drag-file-here-or-click")}
              </span>
              {headers.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#1d9e75]/10 px-3 py-1 text-xs font-semibold text-[#137a59]">
                  <FiCheckCircle />
                  {t("columns-detected")}
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept=".csv,.json,application/json,text/csv"
              onChange={event => void applyFile(event.target.files?.[0])}
            />
            {fileError && <p className="text-sm font-semibold text-red-600">{fileError}</p>}
          </div>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-gray-700">{t("title")}</span>
            <input
              className="h-12 w-full rounded-md border border-gray-300 bg-white px-4 text-right text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              value={formData.title}
              onChange={event => {
                setTitleWasEdited(true);
                updateFormValue('title', event.target.value);
              }}
              placeholder={t("layer-name-placeholder")}
              required
            />
          </label>

          {headers.length > 0 && (
            <div className="rounded-lg border border-[#1d9e75]/25 bg-[#1d9e75]/5 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs text-[#137a59]">{t("auto-detected-if-possible")}</span>
                <h4 className="text-base font-bold text-gray-900">{t("column-mapping")}</h4>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <LayerColumnSelect
                  label={t("name-column")}
                  value={formData.name_column}
                  headers={headers}
                  onChange={value => updateFormValue('name_column', value)}
                />
                <LayerColumnSelect
                  label={t("latitude-column")}
                  value={formData.lat_column}
                  headers={headers}
                  onChange={value => updateFormValue('lat_column', value)}
                />
                <LayerColumnSelect
                  label={t("longitude-column")}
                  value={formData.lon_column}
                  headers={headers}
                  onChange={value => updateFormValue('lon_column', value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-5 border-t border-gray-200 pt-5">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">{t("color")}</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-12 w-14 cursor-pointer rounded-md border border-gray-300 bg-white p-1"
                  value={formData.points_color}
                  onChange={event => updateFormValue('points_color', event.target.value)}
                  required
                />
                <input
                  className="h-12 flex-1 rounded-md border border-gray-300 bg-white px-4 text-left font-semibold text-gray-900 outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                  value={formData.points_color}
                  onChange={event => updateFormValue('points_color', event.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                  dir="ltr"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                {t("delete-after-days-optional")}
              </span>
              <input
                type="number"
                min="1"
                className="h-12 w-full rounded-md border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                value={formData.delete_after_days}
                onChange={event => updateFormValue('delete_after_days', event.target.value)}
                placeholder="30"
              />
            </label>
          </div>

          <label className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
            <button
              type="button"
              role="switch"
              aria-checked={formData.deduplicate}
              className={`relative h-9 w-16 rounded-full transition ${
                formData.deduplicate ? 'bg-[#1d9e75]' : 'bg-gray-300'
              }`}
              onClick={() => updateFormValue('deduplicate', !formData.deduplicate)}
            >
              <span
                className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-sm transition ${
                  formData.deduplicate ? 'right-8' : 'right-1'
                }`}
              />
            </button>
            <span className="text-base font-bold text-gray-900">{t("deduplicate")}</span>
          </label>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-7 py-5">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-md bg-[#1d9e75] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a8c68] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DataContainer() {
  const {
    selectedContainerType,
    selectedContainerLayerModalOpen,
    setSelectedContainerLayerModalOpen,
    handleAddClick,
    setGeoPoints,
    isLoading,
  } = useCatalogContext();
  const { setSelectedCity, setSelectedCountry } = useLayerContext();
  const { authResponse } = useAuth();
  const { closeModal } = useUIContext();
  const [activeTab, setActiveTab] = useState('Data Catalogue');
  const [resData, setResData] = useState<(Catalog | UserLayer)[] | string>('');
  // layers data that will be sat after user clicks Add Layer
  const [userLayersData, setUserLayersData] = useState<UserLayer[]>([]);
  const [userCatalogsData, setUserCatalogsData] = useState<Catalog[]>([]);
  const [, setResMessage] = useState<string>('');
  const [, setResId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [, setWsResMessage] = useState<string>('');
  const [, setWsResId] = useState<string>('');
  const [, setWsResLoading] = useState<boolean>(false);
  const [, setWsResError] = useState<Error | null>(null);
  const [loadFiles, setLoadFiles] = [selectedContainerLayerModalOpen, setSelectedContainerLayerModalOpen];
  const [loadFilesLayers, setLoadFilesLayers] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  useEffect(() => {
	  if(selectedContainerLayerModalOpen)
		  setActiveTab('Load Files') 
  }, [selectedContainerLayerModalOpen]);
   
  useEffect(() => {
  	(async () => {
	  	if(activeTab === "Load Files") {
	  		setLoading(true);
	  		try {
		      const body = { user_id: authResponse?.localId };
		      const res = await apiRequest({
		        url: urls.layers_upload_file_all,
		        method: 'post',
		        isAuthRequest: true,
		        body: body,
		      });
		      
		  		setLoadFilesLayers(res.data.data);
	      } catch(e) {
	      	console.log(e)
	      }
	  		setLoading(false);
	  	}
  	})();
  }, [activeTab, authResponse]);

  useEffect(() => {
    async function fetchUserLayers() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      try {
        const res = await apiRequest({
          url: urls.user_layers,
          method: 'post',
          isAuthRequest: true,
          body: body,
        });
        setUserLayersData(res.data.data);
        setResMessage(translateApiMessage(res.data, "request-received"));
        setResId(res.data.request_id);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserCatalogs() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      try {
        const res = await apiRequest({
          url: urls.user_catalogs,
          method: 'post',
          isAuthRequest: true,
          body: body,
        });
        setUserCatalogsData(res.data.data);
        setResMessage(translateApiMessage(res.data, "request-received"));
        setResId(res.data.request_id);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    }

    // Determine which data to fetch based on selected container type
    async function fetchData() {
      setLoading(true);
      setError(null);
      console.log(612, selectedContainerType)
      if (selectedContainerType === 'Layer') {
        await fetchUserLayers();
      } else if (selectedContainerType === 'Catalogue') {
        await fetchUserCatalogs();
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedContainerType, authResponse]);

  useEffect(
    function () {
      // Select the data shown in the modal based on the current mode.
      if (selectedContainerType === 'Catalogue') {
        if (JSON.stringify(resData) !== JSON.stringify(userCatalogsData)) {
          setResData(userCatalogsData);
        }
      } else if (selectedContainerType === 'Layer') {
        if (JSON.stringify(resData) !== JSON.stringify(userLayersData)) {
          setResData(userLayersData);
        }
      } else if (selectedContainerType === 'Home') {
        if (resData !== '') {
          setResData('');
        }
      }
    },
    [userLayersData, userCatalogsData, selectedContainerType, resData]
  );

  // Handle click event on catalog card
  async function handleCatalogCardClick(selectedItem: CardItem) {
    if (selectedContainerType === 'Home') {
      setWsResLoading(true);

      try {
        const res = await apiRequest({
          url: urls.http_catlog_data,
          method: 'post',
          body: { catalogue_dataset_id: selectedItem.id },
        });
        setGeoPoints(res.data.data);
        setWsResMessage(translateApiMessage(res.data, "request-received"));
        setWsResId(res.data.request_id);
        setWsResLoading(false);
        closeModal();
        console.log('res', res);
      } catch (error) {
        setWsResError(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      // layer or catalog
      // we are here
      await handleAddClick(
        selectedItem.id,
        selectedItem.typeOfCard,
        (country: string, city: string) => {
          setSelectedCountry(country);
          setSelectedCity(city);
        }
      );
    }

    closeModal();
  }

  // Render a card based on the item type
  function makeCard(item: Catalog | UserLayer, index: number) {
    if ('layer_id' in item) {
      // Render UserLayerCard if item is a user layer
      return (
        <UserLayerCard
          key={item.layer_id + '-' + index} // Use a combination of id and index
          id={item.layer_id}
          name={item.layer_name}
          description={item.layer_description}
          legend={item.layer_legend}
          typeOfCard="layer"
          points_color={item.points_color}
          progress={item.progress}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.layer_id,
              name: item.layer_name,
              typeOfCard: 'layer',
              points_color: isValidColor(item.points_color as string)
                ? item.points_color
                : undefined,
              legend: item.layer_legend,
            });
          }}
        />
      );
    } else {
      // Render CatalogueCard if item is a catalog
      const typeOfCard = 'catalog_name' in item ? 'userCatalog' : 'catalog';
      return (
        <CatalogueCard
          key={(item.id || item.catalog_id || '') + '-' + index}
          id={item.id || item.catalog_id || ''}
          thumbnail_url={item.thumbnail_url || item.image || ''}
          name={item.name || item.catalog_name || ''}
          records_number={item.records_number || item.total_records || 0}
          description={item.description || item.catalog_description || ''}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.id || item.catalog_id || '',
              name: item.name || item.catalog_name || '',
              typeOfCard: typeOfCard,
              ...(typeOfCard === 'userCatalog' && { layers: item.layers }),
            });
          }}
          can_access={item.can_access ?? false}
          typeOfCard={typeOfCard}
        />
      );
    }
  }

  // Render cards based on filtered data
  function renderCards() {
    if (typeof resData === 'string') {
      return <div>{resData}</div>;
    }

    if (Array.isArray(resData)) {
      return resData.map(function (item, index) {
        return makeCard(item, index);
      });
    }

    return null;
  }

  if (error) {
    return <div>{t("error")}{' '}{error.message}</div>;
  }
  if (loading) {
    return <Spinner className="size-32 " />;
  }
  
  const addLayerUploadFile = async function(body) {
  	setUploadLoading(true);
    setUploadError('');
  	try {
	  	const res = await apiRequest({
		    url: urls.layers_upload_file_new,
		    method: 'post',
		    isAuthRequest: true,
		    body,
		    isFormData: true,
		  })
      if (res?.data?.data) {
        setLoadFilesLayers(prev => [res.data.data, ...prev]);
      }
		  setLoadFiles(false);
	  } catch(e) {
	  	console.log(e);
      const detail = e?.response?.data?.detail;
      setUploadError(
        detail?.message || detail?.detail || e?.message || t("could-not-upload-layer-file")
      );
	  }

  	setUploadLoading(false);
  }

  return (
    <div className={`lg:p-6 h-full ${selectedContainerType === 'Home' ? 'px-2 py-1' : 'p-2'}`}>
      {/* when add layer or category */}
      {isLoading && (
        <div className="fixed top-0 start-0 w-screen h-screen bg-black bg-opacity-30 z-50">
          <Spinner className="size-32 border-white border-4" />
        </div>
      )}

      <h2 className="text-2xl text-center font-semibold">
        {selectedContainerType ==="Catalogue"
          ?t("add-data-to-map")
          : selectedContainerType ==="Home"
            ? ''
            :t("add-layers-to-map")}
      </h2>
      {selectedContainerType ==="Home" ? (
        <>
          <CampaignPage />
        </>
      ) : (
        <>
          <div className="flex flex-wrap lg:gap-0 gap-2 w-full justify-center items-center my-4 rounded-xl font-semibold">
            <button
              className={`${
                (activeTab === 'Data Catalogue' && selectedContainerType === 'Catalogue') ||
                (activeTab === 'Data Layer' && selectedContainerType === 'Layer')
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab(
                  selectedContainerType === 'Catalogue' ? 'Data Catalogue' : 'Data Layer'
                );
              }}
            >
              {selectedContainerType ==="Catalogue" ?t("data-catalogue") :t("data-layer")}
            </button>
            <button
              className={`${
                activeTab === 'Load Files'
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab('Load Files');
              }}
            >{t("load-files")}</button>
            <button
              className={`${
                activeTab === 'Connect Your Data'
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab('Connect Your Data');
              }}
            >{t("connect-your-data")}</button>
          </div>
          {activeTab ==="Data Catalogue" || activeTab ==="Data Layer" ? (
            <div className="w-full pb-10">
              {selectedContainerType ==="Catalogue" && activeTab ==="Data Catalogue" && (
                <div className="mb-6 p-4 rounded-xl bg-[#f0f7ff] border border-[#c5d9f1] text-[#1a365d]">
                  <p className="font-semibold mb-2">{t("build-your-own-data-catalogue")}</p>
                  <p className="text-sm leading-relaxed">{t("create-a-catalogue-by-adding-multiple")}{' '}<strong>{t("layers-2")}</strong>{' '}{t("from-the-layers-section-and-saving-them-together-you-can-combine-layers-with")}{' '}<strong>{t("pins")}</strong>{' '}{t("and")}{' '}<strong>{t("drawings")}</strong>{' '}{t("on-the-map-to-organize-your-data-the-way-you-want-once-saved-your-layers-and-ann")}</p>
                </div>
              )}
              <div
                className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-x-2 gap-y-10 w-full"
                // overflow-y-auto
              >
                {renderCards()}
              </div>
              {selectedContainerType ==="Catalogue" &&
                activeTab ==="Data Catalogue" &&
                Array.isArray(resData) &&
                resData.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-[#c5d9f1] bg-[#f8fbff] p-6 text-center text-[#1a365d]">{t("no-saved-catalogues-yet-build-one-by-adding-layers-to-the-map-and-saving-them-as")}</div>
                )}
            </div>
          ) : activeTab === 'Load Files' ? (
            <div className="text-center p-8 text-[1.2rem] text-[#666]">
              <div
                className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-x-2 gap-y-10 w-full"
              >
		            {loadFilesLayers.map((item, index) => 
                 <UserLayerCard
					          key={item.layer_id + '-' + index} // Use a combination of id and index
					          id={item.layer_id}
					          name={item.title}
					          description={item.description}
					          legend={""}
					          typeOfCard="layer"
					          points_color={item.points_color}
					          progress={null}
					          onMoreInfo={function () {
					          	(async function() {
					          		setLoading(true);
									      try {
									        const res = await apiRequest({
									          url: urls.layers_upload_file_single,
									          method: 'post',
									          body: { layer_id: item.layer_id, user_id: authResponse?.localId },
									        });
									        const data = {
                            ...res.data.data,
                            display: true,
                            layerId: item.layer_id,
                            layer_name: res.data.data.layer_name || item.title,
                            layer_legend: res.data.data.layer_legend || item.title,
                            layer_description: res.data.data.layer_description || item.description || '',
                            points_color: res.data.data.points_color || item.points_color,
                            records_count: res.data.data.records_count || item.records_count,
                          };
									        data.features = (data.features || []).filter(hasValidPointCoordinates);
											    setGeoPoints(function (prevGeoPoints) {
											      const updatedGeoPoints = prevGeoPoints.slice().concat(data);
											      return updatedGeoPoints;
											    });
									        setResMessage(translateApiMessage(res.data, "request-received"));
									        setResId(res.data.request_id);
									        closeModal();
									        console.log('res', res);
									      } catch (error) {
									        setWsResError(error instanceof Error ? error : new Error(String(error)));
									      } finally {
									        console.log('finally.....................');
									      }
					          		setLoading(false);
								      })()
					          }}
					        />)}
		            <UserLayerCard
				          id={0}
				          name={t("add-your-own-data")}
				          description={t("import-your-own-data-file-types")}
				          legend={""}
				          typeOfCard="layer"
				          points_color={"orange"}
				          onMoreInfo={function () {
 					          setLoadFiles(true);
				          }}
			            />
	            </div>
	            <LayerUploadModal
                open={loadFiles}
                onOpenChange={setLoadFiles}
                userId={authResponse?.localId}
                onSubmit={addLayerUploadFile}
                submitting={uploadLoading}
                errorMessage={uploadError}
              />
            </div>
          ) : (
            <div className="text-center p-8 text-[1.2rem] text-[#666]">{t("connect-your-data-content")}</div>
          )}
        </>
      )}
    </div>
  );
}

export default DataContainer;
