import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ar from './locales/ar.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ko from './locales/ko.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
  ar: { translation: ar },
  it: { translation: it },
  ru: { translation: ru },
  ko: { translation: ko }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    react: {
      useSuspense: false
    }
  });

// Force reload when language changes to ensure all components update
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = async (lng?: string, callback?: ((err: any, t: any) => void) | undefined) => {
  console.log('Changing language to:', lng);
  const result = await originalChangeLanguage.call(i18n, lng, callback);
  
  // Store in localStorage to ensure persistence
  if (lng) {
    localStorage.setItem('i18nextLng', lng);
  }
  
  return result;
};

export default i18n;