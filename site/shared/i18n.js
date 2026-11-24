// Language and theme, decided before the page draws (loaded in <head>, right after edition.js).
//   t('Name this chord')                   → 'Benenne diesen Akkord' in German, else the English as written
//   t('You played {a}.', { a: 'C4' })      placeholders in braces
//   tr({ en: '…', de: '…' }) or tr(obj, 'about') for data with a German version (pieces, drills)
//   <p data-t>Some text</p>                static HTML: translated when the page has loaded
// The English text is the key, so the code stays readable; tools/check.mjs fails the build if a t('…')
// in any page has no German translation in shared/i18n-de.js.
(function () {
  const ED = self.EDITION || {};
  const P = ED.slug || 'music-academy';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(P + ':prefs') || '{}'); } catch (e) {}
  const nav = (self.navigator && navigator.language) || 'en';
  const lang = prefs.lang === 'de' || prefs.lang === 'en' ? prefs.lang : /^de\b/i.test(nav) ? 'de' : 'en';
  const theme = prefs.theme === 'mono' ? 'mono' : 'color';
  if (self.document) {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
  }

  function t(s, params) {
    let out = lang === 'de' && self.I18N_DE && self.I18N_DE[s] !== undefined ? self.I18N_DE[s] : s;
    if (params) out = out.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
    return out;
  }
  // per-language data: tr(piece, 'about') reads piece.de.about in German, else piece.about
  function tr(obj, field) {
    if (!obj) return '';
    if (field) return (lang === 'de' && obj.de && obj.de[field] !== undefined) ? obj.de[field] : obj[field];
    return obj[lang] !== undefined ? obj[lang] : obj.en;
  }
  function translateDom(root) {
    for (const el of root.querySelectorAll('[data-t]')) {
      const key = el.dataset.t || el.innerHTML.trim();
      el.dataset.t = key;
      el.innerHTML = t(key);
    }
    for (const el of root.querySelectorAll('[data-t-title]')) el.title = t(el.dataset.tTitle);
  }
  if (self.document) document.addEventListener('DOMContentLoaded', () => translateDom(document));

  self.t = t;
  self.tr = tr;
  self.I18N = { lang, theme, t, tr, translateDom };
})();
