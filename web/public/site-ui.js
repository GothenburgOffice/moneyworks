document.querySelectorAll('[data-mobile-menu]').forEach((menu) => {
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) menu.open = false;
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
});

// Default to the selected dark C design. Content does not depend on this script.
const themeButton = document.querySelector('[data-theme-toggle]');
if (themeButton) {
  const allowedThemes = ['light', 'dark'];
  let theme = new URLSearchParams(location.search).get('theme');
  if (!allowedThemes.includes(theme)) theme = 'dark';
  const applyTheme = (updateURL = false) => {
    document.documentElement.dataset.theme = theme;
    const label = theme === 'dark' ? themeButton.dataset.lightLabel : themeButton.dataset.darkLabel;
    themeButton.setAttribute('aria-label', label);
    themeButton.setAttribute('title', label);
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    document.querySelectorAll('[data-locale-link]').forEach((link) => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('theme', theme);
      link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    });
    if (updateURL) {
      try {
        const url = new URL(location.href);
        url.searchParams.set('theme', theme);
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      } catch { /* Opaque preview frames may restrict history. */ }
    }
  };
  applyTheme();
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(true);
  });
}
