import i18next from 'i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

void i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    ar: {
      translation: ar,
    },
    en: {
      translation: en,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export const t = i18next.t.bind(i18next);
export default i18next;
