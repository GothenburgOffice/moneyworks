import type { SiteCopy } from "@/content/site";

// Static HTML, enhanced by site-ui.js rather than a client component tree.
export function ThemeToggle({ copy }: { copy: SiteCopy["nav"] }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      suppressHydrationWarning
      data-theme-toggle
      data-light-label={copy.themeLight}
      data-dark-label={copy.themeDark}
      aria-label={copy.themeLight}
      title={copy.themeLight}
      aria-pressed="true"
      hidden
    >
      <svg
        className="theme-sun"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="theme-moon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20.5 14.3A9 9 0 0 1 9.7 3.5a9 9 0 1 0 10.8 10.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
