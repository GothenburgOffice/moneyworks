document.querySelectorAll("[data-mobile-menu]").forEach((menu) => {
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) menu.open = false;
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
});

// No player library: native controls work independently of this enhancement.
document.querySelectorAll("[data-tool-demo]").forEach((demo) => {
  demo.addEventListener("toggle", () => {
    if (!demo.open) demo.querySelector("video")?.pause();
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.querySelectorAll("[data-tool-demo] video").forEach((video) => video.pause());
  }
});

// A constant-height sticky slot reserves the original header space: changing the
// inner bar height never shifts content or oscillates the compact threshold.
const stickyHeader = document.querySelector("[data-sticky-header]");
if (stickyHeader) {
  let scheduled = false;
  const updateHeader = () => {
    const compact = String(window.scrollY > stickyHeader.offsetHeight);
    if (stickyHeader.dataset.compact !== compact) stickyHeader.dataset.compact = compact;
    if (document.documentElement.dataset.headerCompact !== compact) {
      document.documentElement.dataset.headerCompact = compact;
    }
    scheduled = false;
  };
  const scheduleHeader = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateHeader);
    }
  };
  window.addEventListener("scroll", scheduleHeader, { passive: true });
  window.addEventListener("resize", scheduleHeader);
  window.addEventListener("pageshow", scheduleHeader);
  updateHeader();
}

// Default to the selected dark C design. Content does not depend on this script.
const themeButton = document.querySelector("[data-theme-toggle]");
if (themeButton) {
  const allowedThemes = ["light", "dark"];
  let theme = new URLSearchParams(location.search).get("theme");
  if (!allowedThemes.includes(theme)) theme = "dark";
  const applyTheme = (updateURL = false) => {
    document.documentElement.dataset.theme = theme;
    const label = theme === "dark" ? themeButton.dataset.lightLabel : themeButton.dataset.darkLabel;
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("title", label);
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    document.querySelectorAll("[data-locale-link]").forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.href);
      url.searchParams.set("theme", theme);
      link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
    });
    if (updateURL) {
      try {
        const url = new URL(location.href);
        url.searchParams.set("theme", theme);
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        /* Some browsers throttle or block replaceState; the links still carry the theme. */
      }
    }
  };
  applyTheme();
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme(true);
  });
}
