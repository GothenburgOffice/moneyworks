import type { Locale } from "@/content/site";

// Whole currency units for results; rates keep two decimals.
export function fireFormatters(locale: Locale) {
  const tag = locale === "sv" ? "sv-SE" : "en-GB";
  const rate = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 });
  const regular = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const large = new Intl.NumberFormat(tag, { notation: "scientific", maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat(tag, { notation: "compact", maximumFractionDigits: 0 });
  const number = (value: number) =>
    (Math.abs(value) >= 1e15 ? large : regular).format(Math.abs(value) < 0.5 ? 0 : value);
  return {
    number,
    rate: (value: number) => `${rate.format(Math.abs(value) < 0.005 ? 0 : value)}%`,
    axis: (value: number) => (value >= 1e15 ? large : compact).format(value),
  };
}

export type FireFormatters = ReturnType<typeof fireFormatters>;
