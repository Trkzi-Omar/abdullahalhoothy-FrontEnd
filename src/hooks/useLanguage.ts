import { useState, useEffect } from 'react';
import i18next from '../i18n';

const LANG_STORAGE_KEY = 'landing-lang';

export function useLanguage() {
  const [lang, setLang] = useState<'en' | 'ar'>(() =>
    i18next.language === 'ar' ? 'ar' : 'en'
  );

  useEffect(() => {
    const handleChange = (lng: string) => setLang(lng === 'ar' ? 'ar' : 'en');
    i18next.on('languageChanged', handleChange);
    return () => i18next.off('languageChanged', handleChange);
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    void i18next.changeLanguage(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  return { lang, toggleLanguage };
}
