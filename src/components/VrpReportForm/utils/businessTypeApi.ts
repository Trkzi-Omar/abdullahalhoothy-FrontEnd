const normalizeBusinessTypeValue = (value: string): string =>
  value.trim().replace(/^@+|@+$/g, '').replace(/\s+/g, ' ');

const formatCategoryName = (category: string): string =>
  category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const findExactCategoryMatch = (value: string, categories: string[]): string | undefined => {
  const normalizedValue = normalizeBusinessTypeValue(value).toLowerCase();
  if (!normalizedValue) return undefined;

  return categories.find(category => {
    const normalizedCategory = category.toLowerCase();
    const normalizedFormattedCategory = formatCategoryName(category).toLowerCase();
    return (
      normalizedCategory === normalizedValue || normalizedFormattedCategory === normalizedValue
    );
  });
};

export const formatBusinessTypeForApi = (
  value: string | null | undefined,
  categories: string[]
): string | undefined => {
  if (!value) return undefined;

  const normalizedValue = normalizeBusinessTypeValue(value);
  if (!normalizedValue) return undefined;

  if (categories.length === 0) {
    return normalizedValue;
  }

  const matchedCategory = findExactCategoryMatch(normalizedValue, categories);
  return matchedCategory || `@${normalizedValue}@`;
};
