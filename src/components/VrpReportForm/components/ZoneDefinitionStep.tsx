import { useState, useEffect, useRef } from 'react';
import apiRequest from '../../../services/apiRequest';
import urls from '../../../urls.json';
import i18next, { t } from '../../../i18n';
import { FaMapMarkedAlt, FaSpinner, FaPlus, FaMinus, FaSearch } from 'react-icons/fa';
import type { DistrictItem } from '../../../types/vrp';

/* ── Component ──────────────────────────────────────────────────────────── */

interface ZoneDefinitionStepProps {
  cityName: string;
  countryName: string;
  disabled: boolean;
  /** Called when the user wants to add (union) a district to the current driver's polygon */
  onAddDistrict: (districtId: number) => Promise<void>;
  /** Called when the user wants to subtract (remove) a district from the current driver's polygon */
  onSubtractDistrict: (districtId: number) => Promise<void>;
  /** Set of district IDs currently unioned into the driver's polygon */
  selectedDistrictIds?: number[];
  /** Whether a polygon operation is in progress */
  isPolygonOpInProgress?: boolean;
}

export default function ZoneDefinitionStep({
  cityName,
  countryName,
  disabled,
  onAddDistrict,
  onSubtractDistrict,
  selectedDistrictIds,
  isPolygonOpInProgress,
}: ZoneDefinitionStepProps) {
  /* ── District list state ──────────────────────────────────────────── */
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const prevCityRef = useRef('');

  /* ── Track which district is currently being operated on ──────────── */
  const [operatingDistrictId, setOperatingDistrictId] = useState<number | null>(null);

  /* ── Fetch district list when city changes ────────────────────────── */
  useEffect(() => {
    if (!cityName) {
      setDistricts([]);
      return;
    }
    if (cityName === prevCityRef.current) return;
    prevCityRef.current = cityName;

    setLoading(true);
    setError(null);
    setSearchQuery('');

    apiRequest({
      url: urls.districts,
      method: 'POST',
      body: {
        city_name: cityName,
        country_name: countryName,
        include_geometry: false,
        limit: 500,
      },
    })
      .then((res: unknown) => {
        const r = res as { data?: { data?: { districts?: DistrictItem[] } } };
        setDistricts(r?.data?.data?.districts ?? []);
      })
      .catch(() => {
        setDistricts([]);
        setError(t('failed-to-load-districts'));
      })
      .finally(() => setLoading(false));
  }, [cityName, countryName]);

  /* ── Determine current UI language for name display ordering ────── */
  const isArabic = i18next.language?.startsWith('ar');

  /* ── Simple fuzzy matcher ─────────────────────────────────────────── */
  function fuzzyMatch(text: string, query: string): boolean {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  /* ── Filter districts by search query (fuzzy) ─────────────────────── */
  const query = searchQuery.trim().toLowerCase();
  const filteredDistricts = query
    ? districts.filter(
        (d) =>
          fuzzyMatch(d.name_en.toLowerCase(), query) ||
          fuzzyMatch(d.name_ar.toLowerCase(), query),
      )
    : districts;

  /* ── Sorted: selected first, then rest ────────────────────────────── */
  const selectedSet = new Set(selectedDistrictIds ?? []);
  const sortedDistricts = [...filteredDistricts].sort((a, b) => {
    const aSelected = selectedSet.has(a.district_id) ? 0 : 1;
    const bSelected = selectedSet.has(b.district_id) ? 0 : 1;
    if (aSelected !== bSelected) return aSelected - bSelected;
    return a.local_seq - b.local_seq;
  });

  /* ── Handle + / - click ──────────────────────────────────────────── */
  const handleDistrictAction = async (districtId: number, isAdd: boolean) => {
    setOperatingDistrictId(districtId);
    try {
      if (isAdd) {
        await onAddDistrict(districtId);
      } else {
        await onSubtractDistrict(districtId);
      }
    } finally {
      setOperatingDistrictId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaMapMarkedAlt className="w-4 h-4 text-primary" />
          {t('zone-definition')}
        </h4>
      </div>

      {/* ── District panel (always visible when districts are loaded) ─── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search-districts')}
            disabled={disabled || loading}
            className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
          />
        </div>

        {/* Status line */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {selectedSet.size === 0
              ? t('no-districts-selected')
              : `${selectedSet.size} ${t('districts-selected')}`}
          </span>
          {(loading || isPolygonOpInProgress) && (
            <span className="flex items-center gap-1">
              <FaSpinner className="w-3 h-3 animate-spin" />
              {loading ? t('loading') : t('updating')}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* District list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : sortedDistricts.length > 0 ? (
          <div className="max-h-[350px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {sortedDistricts.map((district) => {
              const isSelected = selectedSet.has(district.district_id);
              const isOperating = operatingDistrictId === district.district_id;
              return (
                <div
                  key={district.district_id}
                  className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/5'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* District name */}
                  <div className="flex-1 min-w-0">
                    {isArabic ? (
                      <>
                        <span className="block truncate text-gray-800 font-medium">{district.name_ar}</span>
                        <span className="block truncate text-gray-400">{district.name_en}</span>
                      </>
                    ) : (
                      <>
                        <span className="block truncate text-gray-800 font-medium">{district.name_en}</span>
                        <span className="block truncate text-gray-400">{district.name_ar}</span>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isSelected ? (
                      /* Remove (-) button */
                      <button
                        type="button"
                        onClick={() => handleDistrictAction(district.district_id, false)}
                        disabled={disabled || isOperating || isPolygonOpInProgress}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={t('remove-district')}
                      >
                        {isOperating ? (
                          <FaSpinner className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <FaMinus className="w-2.5 h-2.5" />
                        )}
                        <span>{t('remove')}</span>
                      </button>
                    ) : (
                      /* Add (+) button */
                      <button
                        type="button"
                        onClick={() => handleDistrictAction(district.district_id, true)}
                        disabled={disabled || isOperating || isPolygonOpInProgress}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-green-200 text-green-600 bg-white hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={t('add-district')}
                      >
                        {isOperating ? (
                          <FaSpinner className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <FaPlus className="w-2.5 h-2.5" />
                        )}
                        <span>{t('add-3')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">
            {query ? t('no-matching-districts') : t('no-districts-available')}
          </p>
        )}
      </div>
    </div>
  );
}

