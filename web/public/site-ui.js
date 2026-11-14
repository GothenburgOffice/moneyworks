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

// The theme follows the system until the visitor picks one; the pick is kept in
// localStorage. The inline script in <head> applies it before paint; this only
// wires the toggle. Without JavaScript the page stays dark and the toggle hidden.
const themeButton = document.querySelector("[data-theme-toggle]");
if (themeButton) {
  const root = document.documentElement;
  const valid = (value) => value === "light" || value === "dark";
  const stored = () => {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null; // Storage blocked: the toggle still works for this page.
    }
  };
  const label = () => {
    const name =
      root.dataset.theme === "dark"
        ? themeButton.dataset.lightLabel
        : themeButton.dataset.darkLabel;
    themeButton.setAttribute("aria-label", name);
    themeButton.setAttribute("title", name);
    themeButton.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
  };
  if (!valid(root.dataset.theme)) root.dataset.theme = "dark";
  label();
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* Not persisted, but applied to this page. */
    }
    label();
  });
  // Follow a system change until the visitor has picked a theme.
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", (event) => {
    if (valid(stored())) return;
    root.dataset.theme = event.matches ? "light" : "dark";
    label();
  });
  // Another tab picked a theme.
  window.addEventListener("storage", (event) => {
    if (event.key === "theme" && valid(event.newValue)) {
      root.dataset.theme = event.newValue;
      label();
    }
  });
}
