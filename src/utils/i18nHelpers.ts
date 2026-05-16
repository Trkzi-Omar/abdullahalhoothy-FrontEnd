export const toTranslationKey = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/&/g, 'and')
    .replace(/[/_,]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
