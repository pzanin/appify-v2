import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_TRANSLATIONS } from '../constants';

const resources = {
  pt: { translation: DEFAULT_TRANSLATIONS['pt-BR'].strings },
  en: { translation: DEFAULT_TRANSLATIONS['en-US'].strings },
  es: { translation: DEFAULT_TRANSLATIONS['es'].strings },
  fr: { translation: DEFAULT_TRANSLATIONS['fr'].strings }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
