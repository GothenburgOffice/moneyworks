import english from "../../messages/en.json";
import swedish from "../../messages/sv.json";

export type SiteCopy = typeof english.Site;
export type Locale = "en" | "sv";

export function getSiteCopy(locale: Locale): SiteCopy {
  return locale === "sv" ? swedish.Site : english.Site;
}
