import { t } from '../i18n';
import metaDataInformation from '../data/metaDataInformation.json';
import { translateApiMessage } from './apiMessages';

type DatasetMetaKey = keyof typeof metaDataInformation.datasets;
type IntelligenceMetaKey = keyof typeof metaDataInformation.intelligence;

function normalizeMetadataKey(name: string | undefined | null): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function getDatasetMetaKey(name: string | undefined | null): DatasetMetaKey {
  const normalized = normalizeMetadataKey(name);

  if (
    normalized === 'real_estate' ||
    normalized.includes('_for_rent') ||
    normalized.includes('_for_sale')
  ) {
    return 'real_estate';
  }

  return 'google_categories';
}

function getIntelligenceMetaKey(name: string | undefined | null): IntelligenceMetaKey | null {
  const normalized = normalizeMetadataKey(name);
  if (normalized === 'population' || normalized === 'population_intelligence') return 'population';
  if (normalized === 'income' || normalized === 'income_intelligence') return 'income';
  if (normalized === 'real_estate' || normalized === 'real_estate_intelligence') return 'real_estate';
  return null;
}

export function translateWithBackendCategoryFallback(key: string): string {
  const translated = t(key);
  if (translated !== key) return translated;

  const backendCategoryTranslated = t(`backend.categories.${key}`);
  if (backendCategoryTranslated !== `backend.categories.${key}`) return backendCategoryTranslated;

  return key;
}

export function formatSubcategoryName(name: string | undefined | null): string {
  if (!name) return '';
  if (name.includes('_')) {
    const backendCategoryTranslated = t(`backend.categories.${name}`);
    if (backendCategoryTranslated !== `backend.categories.${name}`) return backendCategoryTranslated;
  }

  const translated = translateWithBackendCategoryFallback(name);
  if (translated !== name) return translated;

  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatBusinessTypeName(name: string | undefined | null, lowercaseEnglish = false): string {
  if (!name) return '';

  const normalized = name.trim().replace(/\s+/g, '_').toLowerCase();
  const translated = formatSubcategoryName(normalized);

  return lowercaseEnglish ? translated.toLowerCase() : translated;
}

export function formatIntelligenceName(name: string | undefined | null): string {
  if (!name) return t("unknown");

  const normalized = name.trim().toLowerCase().replace(/_/g, ' ');
  if (normalized === 'population') return t("population-intelligence");
  if (normalized === 'income') return t("income-intelligence");
  if (normalized === 'real estate') return t("real-estate-intelligence");

  return formatSubcategoryName(name);
}

export function formatPurchaseExplanation(
  explanation: string | undefined | null,
  itemName?: string | null
): string {
  if (!explanation) return '';

  if (explanation.startsWith('New purchase of')) {
    return t("new-purchase-of", {
      item: formatIntelligenceName(itemName),
    });
  }

  return explanation;
}

export function formatDatasetDescription(
  datasetName: string | undefined | null,
  fallback?: string | null
): string {
  const metaKey = getDatasetMetaKey(datasetName);
  const descriptionKey = metaDataInformation.datasets[metaKey]?.description_key;
  return descriptionKey ? t(descriptionKey) : fallback || '';
}

export function formatIntelligenceDescription(
  intelligenceName: string | undefined | null,
  fallback?: string | null
): string {
  const metaKey = getIntelligenceMetaKey(intelligenceName);
  const descriptionKey = metaKey ? metaDataInformation.intelligence[metaKey]?.description_key : null;
  return descriptionKey ? t(descriptionKey) : fallback || '';
}

export function formatDatasetPurchaseExplanation(
  explanation: string | undefined | null,
  datasetName?: string | null
): string {
  if (!explanation && !datasetName) return '';

  const isBackendPurchaseText =
    !explanation ||
    /^Dataset ['"].+['"] purchased$/i.test(explanation) ||
    /^New purchase of/i.test(explanation);

  if (isBackendPurchaseText) {
    return t("dataset-purchase-explanation", {
      item: formatSubcategoryName(datasetName),
    });
  }

  return explanation;
}

export function formatPurchaseSuccessMessage(
  itemType: 'dataset' | 'intelligence' | 'report',
  payload?: unknown
): string {
  if (itemType === 'dataset') return translateApiMessage(payload, "dataset-purchase-success-message");
  if (itemType === 'intelligence') return translateApiMessage(payload, "intelligence-purchase-success-message");
  if (itemType === 'report') return translateApiMessage(payload, "report-purchase-success-message");
  return '';
}

/**
 * Normalizes a category type for search (underscores to spaces, lowercase).
 */
function normalizeTypeForSearch(type: string): string {
  return (type || '').replace(/_/g, ' ').toLowerCase();
}

/**
 * Normalizes search query: trims and collapses multiple spaces so spaces are allowed.
 */
function normalizeSearchQuery(query: string): string {
  return (query || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Returns true if needle is a subsequence of haystack (all chars of needle appear in order in haystack).
 * Enables fuzzy matching e.g. "rntl" matches "rental", "cr" matches "car".
 */
function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

/**
 * Fuzzy match: type matches search query when every space-separated token
 * in the query appears in the normalized type (as substring or subsequence).
 * - Allows spaces: multi-word queries work (e.g. "Car Rental" matches "Car_Rental").
 * - Fuzzy: each token can match as subsequence (e.g. "cr rntl" matches "Car Rental").
 */
export function fuzzyMatchCategoryType(type: string, searchQuery: string): boolean {
  const normalizedType = normalizeTypeForSearch(type);
  const normalizedLabel = normalizeTypeForSearch(formatSubcategoryName(type));
  const query = normalizeSearchQuery(searchQuery);
  if (!query) return true;
  const tokens = query.split(' ').filter(Boolean);
  return tokens.every(
    token =>
      normalizedType.includes(token) ||
      isSubsequence(token, normalizedType) ||
      normalizedLabel.includes(token) ||
      isSubsequence(token, normalizedLabel)
  );
}

export function processCityData(
  data: Record<string, unknown>,
  setData: (value: Record<string, unknown>) => void
): string[] {
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    setData(data);
    return keys;
  }
  return [];
}

export const colorOptions = [
  { name: 'red', hex: '#FF5733' },
  { name: 'green', hex: '#28A745' },
  { name: 'blue', hex: '#007BFF' },
  { name: 'yellow', hex: '#FFC107' },
  { name: 'black', hex: '#343A40' },
];

export const colorMap = new Map(colorOptions.map(color => [color.hex, color.name]));

export const getDefaultLayerColor = (layerId: number): string => {
  return colorOptions[layerId % colorOptions.length]?.hex || '#28A745';
};

export function isValidColor(color: string): boolean {
  // Check if the color is a valid hex color
  const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  if (hexColorRegex.test(color)) {
    return true;
  }

  // Check if the color is a valid named color using CSS
  const option = document.createElement('div');
  option.style.color = color;
  return option.style.color !== '';
}

export const handleWhatsAppClick = ({
  phoneNumber,
  message,
}: {
  phoneNumber: string | undefined;
  message: string | undefined;
}) => {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  if (!phoneNumber) throw new Error(t("phone-number-is-required"));

  const whatsappUrl = `https://wa.me/${phoneNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

export const getPriceNumber = (price: number | null, isLoading: boolean = false): string => {
  if (price === null) return 'N/A';
  if (isLoading) return '...';
  return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString();
};
