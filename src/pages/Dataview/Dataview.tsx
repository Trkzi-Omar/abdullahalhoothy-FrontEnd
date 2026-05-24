import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the grid
import { TabularData, Feature } from '../../types/allTypesAndInterfaces';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { useCatalogContext } from '../../context/CatalogContext';
import { isIntelligentLayer } from '../../utils/layerUtils';
import { t } from '../../i18n';

type DataviewRow = TabularData & {
  layer_name: string;
  layer_id: string;
  city_name: string;
  business_status: string;
  phone: string;
  priceLevel: number | null;
  heatmap_weight: number | null;
  points_color: string;
  feature_color: string;
  layer_legend: string;
  latitude: number | null;
  longitude: number | null;
  maps_link: string | null;
};

type DataviewFilterField =
  | 'all'
  | 'layer_name'
  | 'name'
  | 'formatted_address'
  | 'city_name'
  | 'business_status'
  | 'phone'
  | 'website'
  | 'rating'
  | 'user_ratings_total'
  | 'priceLevel'
  | 'feature_color';

type DataviewFilterOperator = 'contains' | 'equals' | 'greater' | 'less';

type NameFilterMode = 'includes' | 'excludes';

type DataviewFilterState = {
  field: DataviewFilterField;
  operator: DataviewFilterOperator;
  value: string;
  nameMode?: NameFilterMode;
};

const normalizeFilterToken = (value: string) => value.trim().replace(/^['"]+|['"]+$/g, '');

const splitFilterTokens = (value: string) =>
  value
    .split(/[\n,]+/)
    .map(normalizeFilterToken)
    .filter(Boolean);

const formatNameFilterToken = (value: string, mode: NameFilterMode) => {
  const normalizedValue = normalizeFilterToken(value);

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue.startsWith('-')) {
    return normalizedValue;
  }

  return mode === 'excludes' ? `-${normalizedValue}` : normalizedValue;
};

const isExcludedNameFilterToken = (value: string) => normalizeFilterToken(value).startsWith('-');

const formatNameFilterChipLabel = (value: string) => {
  const normalizedValue = normalizeFilterToken(value);
  return normalizedValue.startsWith('-') ? normalizedValue.slice(1).trimStart() : normalizedValue;
};

const FeatureColorCell: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '9999px',
          border: '1px solid rgba(15,23,42,0.2)',
          background: value,
          display: 'inline-block',
        }}
      />
      <span>{value}</span>
    </div>
  );
};

const MapLinkCell: React.FC<{ data?: DataviewRow }> = ({ data }) => {
  const url = data?.maps_link;
  if (!url) return <span className="text-slate-400">-</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
      {t('open-in-maps')}
    </a>
  );
};

const NameChipFilterInput: React.FC<{
  value: string;
  mode: NameFilterMode;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, mode, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const tokens = useMemo(() => splitFilterTokens(value), [value]);

  const appendTokens = (nextTokens: string[]) => {
    const normalizedTokens = nextTokens
      .map(token => formatNameFilterToken(token, mode))
      .filter(Boolean);

    if (normalizedTokens.length === 0) {
      return;
    }

    const nextValue = [...tokens, ...normalizedTokens].join(', ');
    onChange(nextValue);
    setInputValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();

      const token = normalizeFilterToken(inputValue);
      if (token) {
        appendTokens([token]);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text');
    const pastedTokens = splitFilterTokens(pastedText);

    if (pastedTokens.length > 0) {
      event.preventDefault();
      appendTokens(pastedTokens);
    }
  };

  const removeToken = (index: number) => {
    onChange(tokens.filter((_, tokenIndex) => tokenIndex !== index).join(', '));
  };

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 shadow-inner shadow-black/20">
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs leading-none ${isExcludedNameFilterToken(token) ? 'border-red-400/30 bg-red-500/10 text-red-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}
        >
          <span className="max-w-[12rem] truncate">{formatNameFilterChipLabel(token)}</span>
          <button
            type="button"
            onClick={() => removeToken(index)}
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] leading-none transition-colors ${isExcludedNameFilterToken(token) ? 'text-red-100 hover:bg-red-400/20' : 'text-emerald-100 hover:bg-emerald-400/20'}`}
            aria-label={`${t('remove')} ${formatNameFilterChipLabel(token)}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
      />
    </div>
  );
};

const hasRenderableValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

// Function to map a feature to tabular data
function mapFeatureToTabularData(feature: Feature, layerName: string, layerId: string): DataviewRow {
  const featureColor =
    typeof feature.properties.gradient_color === 'string' && feature.properties.gradient_color
      ? feature.properties.gradient_color
      : '';

  const propMapsUri =
    typeof feature.properties?.googleMapsUri === 'string'
      ? feature.properties.googleMapsUri
      : typeof feature.properties?.googleMapsURI === 'string'
      ? feature.properties.googleMapsURI
      : typeof feature.properties?.google_maps_uri === 'string'
      ? feature.properties.google_maps_uri
      : null;

  return {
    name: feature.properties.name,
    formatted_address: feature.properties.address,
    website: feature.properties.website,
    rating: Number(feature.properties.rating),
    user_ratings_total: Number(feature.properties.user_ratings_total),
    layer_name: layerName,
    layer_id: layerId,
    city_name: '',
    business_status:
      feature.properties.business_status ?? feature.properties.businessStatus ?? '',
    phone: feature.properties.phone,
    priceLevel: typeof feature.properties.priceLevel === 'number' ? feature.properties.priceLevel : null,
    heatmap_weight:
      typeof feature.properties.heatmap_weight === 'number' ? feature.properties.heatmap_weight : null,
    points_color: '',
    feature_color: featureColor,
    layer_legend: '',
    latitude: feature.geometry?.coordinates?.[1] ?? null,
    longitude: feature.geometry?.coordinates?.[0] ?? null,
    maps_link:
      propMapsUri ??
      (feature.geometry && feature.geometry.coordinates
        ? `https://www.google.com/maps/search/?api=1&query=${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`
        : null),
  };
}

const matchesFilter = (row: DataviewRow, filter: DataviewFilterState) => {
  if (filter.field === 'all' || filter.value.trim() === '') {
    return true;
  }

  const rowValue = row[filter.field as keyof DataviewRow];

  if (filter.field === 'name') {
    const nameTokens = splitFilterTokens(filter.value);

    if (nameTokens.length === 0) {
      return true;
    }

    const normalizedRowValue = String(rowValue ?? '').toLowerCase();
    const includeTokens = nameTokens.filter(token => !token.startsWith('-')).map(token => token.toLowerCase());
    const excludeTokens = nameTokens
      .filter(token => token.startsWith('-'))
      .map(token => token.slice(1).trimStart().toLowerCase());

    const includeMatches = includeTokens.length === 0 || includeTokens.some(token => normalizedRowValue.includes(token));
    const excludeMatches = excludeTokens.every(token => !normalizedRowValue.includes(token));

    return includeMatches && excludeMatches;
  }

  if (filter.operator === 'greater' || filter.operator === 'less') {
    const numericRowValue = Number(rowValue);
    const numericFilterValue = Number(filter.value);

    if (Number.isNaN(numericRowValue) || Number.isNaN(numericFilterValue)) {
      return false;
    }

    return filter.operator === 'greater'
      ? numericRowValue > numericFilterValue
      : numericRowValue < numericFilterValue;
  }

  const normalizedRowValue = String(rowValue ?? '').toLowerCase();
  const normalizedFilterValue = filter.value.toLowerCase();

  if (filter.operator === 'equals') {
    return normalizedRowValue === normalizedFilterValue;
  }

  return normalizedRowValue.includes(normalizedFilterValue);
};

const matchesAllFilters = (row: DataviewRow, filters: DataviewFilterState[]) =>
  filters.every(filter => matchesFilter(row, filter));

const Dataview: React.FC = () => {
  const [businesses, setBusinesses] = useState<DataviewRow[]>([]);
  const [filters, setFilters] = useState<DataviewFilterState[]>([]);
  const { geoPoints } = useCatalogContext();
  const gridApiRef = useRef<GridApi<DataviewRow> | null>(null);
  const columnDefs: ColDef<DataviewRow>[] = [
    { headerName: t('layer'), field: 'layer_name', sortable: true, filter: true },
    {
      headerName: t('feature-color'),
      field: 'feature_color',
      sortable: true,
      cellRenderer: FeatureColorCell,
    },
    {
      headerName: t('maps-link'),
      field: 'maps_link',
      sortable: false,
      cellRenderer: MapLinkCell,
    },
    { headerName: t("table-name"), field: 'name', sortable: true, filter: true },
    {
      headerName: t("address"),
      field: 'formatted_address',
      sortable: true,
      filter: true,
    },
    {
      headerName: t('city-name'),
      field: 'city_name',
      sortable: true,
      filter: true,
    },
    {
      headerName: t('business-status'),
      field: 'business_status',
      sortable: true,
      filter: true,
    },
    {
      headerName: t('phone'),
      field: 'phone',
      sortable: true,
      filter: true,
    },
    {
      headerName: t("website"),
      field: 'website',
      sortable: true,
      filter: true,
    },
    {
      headerName: t("rating"),
      field: 'rating',
      sortable: true,
    },
    {
      headerName: t("total-rating"),
      field: 'user_ratings_total',
      sortable: true,
    },
    {
      headerName: t('price-level'),
      field: 'priceLevel',
      sortable: true,
    },
  ];
  const visibleColumnDefs = columnDefs.filter(column => {
    if (!column.field) {
      return true;
    }

    return businesses.some(row => hasRenderableValue(row[column.field as keyof DataviewRow]));
  });

  useEffect(() => {
    if (geoPoints.length > 0) {
      const visibleLayers = geoPoints.filter(mapFeature => !isIntelligentLayer(mapFeature));

      // Use flatMap to combine features from all non-intelligent layers
      const tabularData = visibleLayers.flatMap(mapFeature =>
        mapFeature.features.map(feature =>
          mapFeatureToTabularData(
            feature,
            mapFeature.layer_name || '',
            String(mapFeature.layer_id || mapFeature.layerId || '')
          )
        )
      );

      const hydratedData = tabularData.map(row => {
        const sourceLayer = visibleLayers.find(layer => String(layer.layer_id || layer.layerId || '') === row.layer_id);
        const layerColor = sourceLayer?.points_color || '';

        return {
          ...row,
          city_name: sourceLayer?.city_name || '',
          points_color: layerColor,
          feature_color: row.feature_color || layerColor,
          layer_legend: sourceLayer?.layer_legend || '',
        };
      });

      setBusinesses(hydratedData);
    } else {
      setBusinesses([]);
    }
  }, [geoPoints]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(row => matchesAllFilters(row, filters));
  }, [businesses, filters]);

  const activeFilterCount = filters.filter(filter => {
    if (filter.field === 'name') {
      return splitFilterTokens(filter.value).length > 0;
    }

    return filter.value.trim() !== '';
  }).length;

  const updateFilter = (index: number, next: Partial<DataviewFilterState>) => {
    setFilters(prev =>
      prev.map((filter, filterIndex) => (filterIndex === index ? { ...filter, ...next } : filter))
    );
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: 'all', operator: 'contains', value: '', nameMode: 'includes' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, filterIndex) => filterIndex !== index));
  };

  const clearFilters = () => setFilters([]);

  const handleGridReady = (event: GridReadyEvent<DataviewRow>) => {
    gridApiRef.current = event.api;

    event.api.sizeColumnsToFit();
  };

  useEffect(() => {
    const onResize = () => {
      const api = gridApiRef.current;
      if (api) {
        api.sizeColumnsToFit();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleExportCsv = useCallback(() => {
    const cols = visibleColumnDefs;
    const headers = cols.map(c => (c.headerName as string) || String(c.field || ''));
    const rows = filteredBusinesses.map(row =>
      cols.map(c => {
        const key = c.field as keyof DataviewRow | undefined;
        const raw = key ? (row[key] as unknown) : '';
        if (raw === null || raw === undefined) return '';
        if (Array.isArray(raw)) return raw.join('|');
        if (typeof raw === 'object') return JSON.stringify(raw);
        return String(raw);
      })
    );

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers.map(h => escape(h)).join(','), ...rows.map(r => r.map(cell => escape(cell)).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const when = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    a.download = `dataview_export_${when}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [visibleColumnDefs, filteredBusinesses]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0f172a] p-4 text-slate-100">
      <div className="mb-4 rounded-xl border border-slate-700 bg-[#182230] p-4 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">{t('table-view')}</h2>
              <p className="mt-1 text-sm text-slate-300">{t('table-view-subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-slate-200">
                {filteredBusinesses.length} {t('rows-visible')}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                {activeFilterCount} {t('filters-active')}
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-900/50 px-3 py-1 text-slate-300">
                {businesses.length} {t('rows-total')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addFilter}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-950/30 transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              {t('add-filter')}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-slate-600 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            >
              {t('clear-all')}
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-slate-700 bg-[#111827] p-3 shadow-sm shadow-black/10 lg:grid-cols-[minmax(180px,1.15fr)_minmax(150px,0.8fr)_minmax(180px,1.3fr)_auto] lg:items-center"
            >
              <select
                value={filter.field}
                onChange={e =>
                  updateFilter(index, {
                    field: e.target.value as DataviewFilterField,
                    operator: e.target.value === 'rating' || e.target.value === 'user_ratings_total' || e.target.value === 'priceLevel'
                      ? 'greater'
                      : 'contains',
                    nameMode: e.target.value === 'name' ? 'includes' : filter.nameMode,
                  })
                }
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25"
              >
                <option value="all">{t('select-field')}</option>
                <option value="layer_name">{t('layer')}</option>
                <option value="name">{t('table-name')}</option>
                <option value="formatted_address">{t('address')}</option>
                <option value="city_name">{t('city-name')}</option>
                <option value="business_status">{t('business-status')}</option>
                <option value="phone">{t('phone')}</option>
                <option value="website">{t('website')}</option>
                <option value="rating">{t('rating')}</option>
                <option value="user_ratings_total">{t('total-rating')}</option>
                <option value="priceLevel">{t('price-level')}</option>
              </select>
              {filter.field === 'name' ? (
                <>
                  <select
                    value={filter.nameMode || 'includes'}
                    onChange={e => updateFilter(index, { nameMode: e.target.value as NameFilterMode })}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25"
                  >
                    <option value="includes">{t('includes')}</option>
                    <option value="excludes">{t('excludes')}</option>
                  </select>
                  <NameChipFilterInput
                    value={filter.value}
                    mode={filter.nameMode || 'includes'}
                    onChange={value => updateFilter(index, { value })}
                    placeholder={t('type-and-press-comma')}
                  />
                </>
              ) : (
                <>
                  <select
                    value={filter.operator}
                    onChange={e => updateFilter(index, { operator: e.target.value as DataviewFilterOperator })}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25"
                  >
                    <option value="contains">{t('contains')}</option>
                    <option value="equals">{t('equals')}</option>
                    <option value="greater">{t('greater-than')}</option>
                    <option value="less">{t('less-than')}</option>
                  </select>
                  <input
                    value={filter.value}
                    onChange={e => updateFilter(index, { value: e.target.value })}
                    placeholder={t('filter-value')}
                    className="min-w-[220px] rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-400 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25"
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => removeFilter(index)}
                className="max-w-[100px] rounded-lg border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400/30"
              >
                {t('remove')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-[#182230] shadow-lg shadow-black/20">
        {filteredBusinesses.length === 0 && businesses.length > 0 ? (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center border-b border-slate-700 bg-[#182230]/95 px-4 py-3 text-sm text-slate-300 backdrop-blur">
            {t('no-rows-match-current-filters')}
          </div>
        ) : null}
        <div
          className="ag-theme-quartz-dark"
          style={{ height: 'calc(100vh - 220px)', width: '100%', backgroundColor: '#182230' }}
        >
          <AgGridReact
            columnDefs={visibleColumnDefs}
            rowData={filteredBusinesses}
            pagination={true}
            paginationPageSize={10}
            defaultColDef={{ resizable: true, flex: 1, minWidth: 100 }}
            enableCellTextSelection={true}
            onGridReady={handleGridReady}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-md border border-slate-600 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
        >
          {t('export-csv')}
        </button>
      </div>
    </div>
  );
};

export default Dataview;
