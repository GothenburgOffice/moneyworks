// Runs in <head> before the body paints, so a stored or system theme never flashes
// dark first. site-ui.js owns the toggle and writes the same key.
export const themeStorageKey = "theme";

const script = `(function(){var t;try{t=localStorage.getItem("${themeStorageKey}")}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
