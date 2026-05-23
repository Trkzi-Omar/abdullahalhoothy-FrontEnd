import { CustomProperties } from '../../types/allTypesAndInterfaces';
import urls from '../../urls.json';
import { t } from '../../i18n';
const googleStreetViewUrl = urls.street_view_link;

const POPUP_KEY_TRANSLATIONS: Record<string, string> = {
  id: 'google-place-id',
  googleMapsUri: 'maps-link',
  primaryType: 'primary-type',
  popularity_score: 'popularity-score',
  popularity_score_category: 'popularity-score-category',
};

function normalizeTranslationKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[/_,\s]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function translateKey(key: string): string {
  const candidates = [
    POPUP_KEY_TRANSLATIONS[key],
    key,
    normalizeTranslationKey(key),
    `backend.categories.${key}`,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const translated = t(candidate);
    if (translated !== candidate) return translated;
  }

  return key;
}

function translateValue(value: string): string {
  const normalized = normalizeTranslationKey(value);
  const backendKey = value.trim().toLowerCase().replace(/\s+/g, '_');
  const candidates = [
    value,
    normalized,
    `backend.categories.${backendKey}`,
  ];

  for (const candidate of candidates) {
    const translated = t(candidate);
    if (translated !== candidate) return translated;
  }

  return value;
}

function formatPopupValue(value: string | number | string[]): string {
  if (Array.isArray(value)) {
    return value.map(item => translateValue(String(item))).join(', ');
  }

  if (typeof value === 'number') return String(value);

  return translateValue(value);
}

function renderHiddenPopupValue(key: string, value: string | number): string {
  return `
    <details class="popup-content-div">
      <summary class="cursor-pointer text-blue-500 underline">${translateKey(key)}: ${t("show")}</summary>
      <div class="break-all text-gray-700">${formatPopupValue(value)}</div>
    </details>`;
}

export function generatePopupContent(
  properties: CustomProperties,
  coordinates: [number, number],
  loading: boolean,
  hasStreetView: boolean
): string {
  let content = `<div class="popup-content">`;

  if (properties.name)
    content += `<strong class="popup-content-strong">${properties.name}</strong>`;

  // Dynamically included fields in the middle
  for (const key in properties) {
    const value = properties[key];
    if (
      key !== 'name' &&
      key !== 'user_ratings_total' &&
      key !== 'rating' &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      let parsedValue = value;
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          console.error(`Failed to parse value for key: ${key}`, e);
        }
      }

      if (Array.isArray(parsedValue)) {
        content += `<div class="popup-content-div">${translateKey(key)}: ${formatPopupValue(parsedValue)}</div>`;
      } else {
        content +=
          key === 'id'
            ? renderHiddenPopupValue(key, parsedValue)
            : typeof parsedValue === 'string' && parsedValue.startsWith('http')
            ? `<div class="popup-content-div">${translateKey(key)}: <a target='_blank' class="text-xs text-blue-500 underline" href=${parsedValue}>${t("click-here")}</a></div>`
            : `<div class="popup-content-div">${translateKey(key)}: ${formatPopupValue(parsedValue)}</div>`;
      }
    }
  }

  if (properties.user_ratings_total)
    content += `<div class="popup-content-div popup-content-total-ratings">${t("total-ratings")}: ${properties.user_ratings_total}</div>`;
  if (properties.rating)
    content += `<div class="popup-content-div popup-content-rating">${t("rating")}: ${properties.rating}</div>`;

  if (loading) {
    content += `<div class="flex items-center gap-2 text-sm font-semibold">
                      <svg
                          class="animate-spin w-4 h-4 fill-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24">
                          <path d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z" />
                      </svg>
        ${t("loading-street-view")}
      </div>`;
  } else if (hasStreetView) {
    content += `<a href="${googleStreetViewUrl}${coordinates[1]},${coordinates[0]}" target="_blank" class="text-sm hover:underline text-gray-900 hover:text-primary font-semibold my-2">${t("open-google-street-view")}</a>`;
  } else {
    content += `<div class="text-sm text-gray-700 font-semibold my-2">${t("no-street-view-available")}</div>`;
  }
  content += `</div>`;
  return content;
}
