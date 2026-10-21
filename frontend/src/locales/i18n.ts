import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import uz from './uz.json';
let saved: string | null = null;
try {
  saved = localStorage.getItem('nr-language');
} catch {
  /* Browser privacy mode may disable storage. */
}
void i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, 'uz-Latn': { translation: uz } },
    lng: saved === 'en' ? 'en' : 'uz-Latn',
    fallbackLng: 'uz-Latn',
    supportedLngs: ['uz-Latn', 'en'],
    interpolation: { escapeValue: false },
  });
i18n.on('languageChanged', (lang) => {
  document.documentElement.lang = lang;
  try {
    localStorage.setItem('nr-language', lang);
  } catch {
    /* Preference stays in memory. */
  }
});
if (typeof document !== 'undefined') document.documentElement.lang = i18n.language;
export default i18n;
