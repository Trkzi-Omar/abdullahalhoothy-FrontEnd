import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the grid
import { Feature } from '../../types/allTypesAndInterfaces';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { useCatalogContext } from '../../context/CatalogContext';
import { isIntelligentLayer } from '../../utils/layerUtils';
import { t } from '../../i18n';

type DataviewRow = Record<string, unknown>;

type DataviewFilterField =
  | 'all'
  | string;

type DataviewFilterOperator = 'contains' | 'equals' | 'greater' | 'less';

type DataviewFilterState = {
  field: DataviewFilterField;
  operator: DataviewFilterOperator;
  value: string;
};

const FeatureColorCell: React.FC<{ value?: unknown }> = ({ value }) => {
  if (typeof value !== 'string' || !value) {
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

const LinkCell: React.FC<{ value?: unknown }> = ({ value }) => {
  const url = typeof value === 'string' ? value : '';
  if (!url) return <span className="text-slate-400">-</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
      {t('open-in-maps')}
    </a>
  );
};

const normalizeTranslationCandidate = (value: string) =>
  value
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const translateCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => translateCellValue(item)).join(', ');
  }

  const rawValue = String(value);
  const candidates = [
    rawValue,
    normalizeTranslationCandidate(rawValue),
    normalizeTranslationCandidate(rawValue).replace(/-/g, '_'),
    `backend.categories.${normalizeTranslationCandidate(rawValue)}`,
    `backend.categories.${normalizeTranslationCandidate(rawValue).replace(/-/g, '_')}`,
  ];

  for (const candidate of candidates) {
    const translated = t(candidate);
    if (translated && translated !== candidate) {
      return translated;
    }
  }

  return rawValue;
};

const GenericCell: React.FC<{ value?: unknown }> = ({ value }) => {
  return <span>{translateCellValue(value)}</span>;
};


const isRenderablePrimitive = (value: unknown) =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isRenderableValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }

  if (Array.isArray(value)) {
    return value.every(item => isRenderablePrimitive(item));
  }

  return isRenderablePrimitive(value);
};

const getColumnHeader = (field: string) => {
  const translated = t(field);
  return translated && translated !== field ? translated : field;
};

const isColorValue = (value: unknown) =>
  typeof value === 'string' && value.trim().startsWith('#');

const isLinkValue = (value: unknown) =>
  typeof value === 'string' && value.trim().toLowerCase().startsWith('http');

const isNumericValue = (value: unknown) =>
  typeof value === 'number' && !Number.isNaN(value);

const EXCLUDED_COLUMN_FIELDS = new Set<string>([
  'bknd_dataset_id',
  'display',
  'id',
  'isTemporary',
  'business_status',
  'layer_id',
  'layer_legend',
  'layerId',
  'type',
]);

// Function to map a feature to tabular data
function mapFeatureToTabularData(feature: Feature, layerProperties: Record<string, unknown>): DataviewRow {
  const featureProperties = feature.properties as Record<string, unknown>;
  const parentProperties = Object.fromEntries(
    Object.entries(layerProperties).filter(([, value]) => isRenderableValue(value))
  );
  const childProperties = Object.fromEntries(
    Object.entries(featureProperties).filter(([, value]) => isRenderableValue(value))
  );

  return {
    ...parentProperties,
    ...childProperties,
  };
}

const matchesFilter = (row: DataviewRow, filter: DataviewFilterState) => {
  if (filter.field === 'all' || filter.value.trim() === '') {
    return true;
  }

  const rowValue = row[filter.field as keyof DataviewRow];

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
  const isRtl = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const docDir = document.documentElement.getAttribute('dir') || document.documentElement.dir || '';
    const docLang = document.documentElement.lang || (typeof navigator !== 'undefined' ? navigator.language : '') || '';
    return docDir.toLowerCase() === 'rtl' || /^ar\b/.test(docLang.toLowerCase());
  }, []);

  const localeText = useMemo(() => ({
    // Pagination & navigation
    pageSizeSelectorLabel: t('ag-grid.pageSizeSelectorLabel'),
    ariaPageSizeSelectorLabel: t('ag-grid.pageSizeSelectorAriaLabel'),
    page: t('ag-grid.page'),
    more: t('ag-grid.more'),
    to: t('ag-grid.to'),
    of: t('ag-grid.of'),
    next: t('ag-grid.next'),
    previous: t('ag-grid.previous'),
    first: t('ag-grid.first'),
    last: t('ag-grid.last'),

    // General
    loadingOoo: t('ag-grid.loading'),
    noRowsToShow: t('ag-grid.noRows'),

    // Filters
    filterOoo: t('ag-grid.filterOoo'),
    equals: t('ag-grid.equals'),
    notEqual: t('ag-grid.notEqual'),
    lessThan: t('ag-grid.lessThan'),
    greaterThan: t('ag-grid.greaterThan'),
    lessThanOrEqual: t('ag-grid.lessThanOrEqual'),
    greaterThanOrEqual: t('ag-grid.greaterThanOrEqual'),
    inRange: t('ag-grid.inRange'),
    contains: t('ag-grid.contains'),
    notContains: t('ag-grid.notContains'),
    startsWith: t('ag-grid.startsWith'),
    endsWith: t('ag-grid.endsWith'),

    // Tool panel / columns
    pinColumn: t('ag-grid.pinColumn'),
    valueAggregation: t('ag-grid.valueAggregation'),
    autosizeThiscolumn: t('ag-grid.autosizeThiscolumn'),
  }), []);
  const fieldMetadata = useMemo(() => {
    const metadata = new Map<string, { sampleValue: unknown; isNumeric: boolean }>();

    businesses.forEach(row => {
      Object.keys(row).forEach(field => {
        if (EXCLUDED_COLUMN_FIELDS.has(field)) {
          return;
        }

        const value = row[field];
        if (!isRenderableValue(value)) {
          return;
        }

        const existing = metadata.get(field);
        if (!existing) {
          metadata.set(field, { sampleValue: value, isNumeric: isNumericValue(value) });
          return;
        }

        if (!existing.isNumeric && isNumericValue(value)) {
          metadata.set(field, { sampleValue: existing.sampleValue, isNumeric: true });
        }
      });
    });

    return metadata;
  }, [businesses]);

  const visibleColumnDefs = useMemo(() => {
    const priorityFields = ['layer_name', 'points_color', 'name', 'city_name', 'neighborhood', 'googleMapsUri', 'primaryType', 'types'];
    const fields = [
      ...priorityFields.filter(field => fieldMetadata.has(field)),
      ...[...fieldMetadata.keys()]
        .filter(field => !priorityFields.includes(field))
        .sort((a, b) => a.localeCompare(b)),
    ];

    return fields.map(field => {
      const sampleValue = fieldMetadata.get(field)?.sampleValue;
      const maybeColor = isColorValue(sampleValue);
      const maybeLink = !maybeColor && isLinkValue(sampleValue);

      return {
        field,
        headerName: getColumnHeader(field),
        sortable: true,
        filter: true,
        ...(maybeColor ? { cellRenderer: FeatureColorCell } : {}),
        ...(maybeLink ? { cellRenderer: LinkCell, sortable: false } : {}),
        ...(!maybeColor && !maybeLink ? { cellRenderer: GenericCell } : {}),
      } as ColDef<DataviewRow>;
    });
  }, [fieldMetadata]);

  const filterableFields = useMemo(
    () => visibleColumnDefs.map(column => ({ field: String(column.field), headerName: String(column.headerName || column.field || '') })),
    [visibleColumnDefs]
  );

  useEffect(() => {
    if (geoPoints.length > 0) {
      const visibleLayers = geoPoints.filter(mapFeature => !isIntelligentLayer(mapFeature));

      const tabularData = visibleLayers.flatMap(mapFeature =>
        mapFeature.features.map(feature =>
          mapFeatureToTabularData(
            feature,
            mapFeature as Record<string, unknown>
          )
        )
      );

      setBusinesses(tabularData);
    } else {
      setBusinesses([]);
    }
  }, [geoPoints]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(row => matchesAllFilters(row, filters));
  }, [businesses, filters]);

  const activeFilterCount = filters.filter(filter => {
    return filter.value.trim() !== '';
  }).length;

  const updateFilter = (index: number, next: Partial<DataviewFilterState>) => {
    setFilters(prev =>
      prev.map((filter, filterIndex) => (filterIndex === index ? { ...filter, ...next } : filter))
    );
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: 'all', operator: 'contains', value: '' }]);
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
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full h-full overflow-y-auto bg-[#0f172a] p-4 text-slate-100">
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
                    operator: fieldMetadata.get(e.target.value)?.isNumeric
                      ? 'greater'
                      : 'contains',
                  })
                }
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25"
              >
                <option value="all">{t('select-field')}</option>
                {filterableFields.map(({ field, headerName }) => (
                  <option key={field} value={field}>
                    {headerName}
                  </option>
                ))}
              </select>
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
            enableRtl={isRtl}
            pagination={true}
            paginationPageSize={20}
            defaultColDef={{ resizable: true, flex: 1, minWidth: 200 }}
            enableCellTextSelection={true}
            onGridReady={handleGridReady}
            localeText={localeText}
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
