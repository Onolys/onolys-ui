// Runs before first paint (classic script, allowed by CSP script-src 'self'): applies the saved theme override.
// Generated into dist/theme-init.js by scripts/copy-styles.mjs; the storage key comes from THEME_STORAGE_KEY
// in src/constants.ts, the single source shared with src/lib/theme.ts.
(function () {
  try {
    var t = localStorage.getItem(__THEME_STORAGE_KEY__);
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  } catch {
    /* storage blocked: follow the OS */
  }
})();
