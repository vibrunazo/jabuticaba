/**
 * Locale-aware formatting of numbers, dates and names, via the built-in Intl APIs.
 * Pure functions.
 */
import { type Locale, localeTags } from "./ui.ts";

export function formatNumber(locale: Locale, value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(localeTags[locale], {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** "0,44–0,48", or a single number when both ends are equal. */
export function formatRange(
  locale: Locale,
  low: number,
  high: number,
  maxFractionDigits = 2,
): string {
  const lowText = formatNumber(locale, low, maxFractionDigits);
  const highText = formatNumber(locale, high, maxFractionDigits);
  return lowText === highText ? lowText : `${lowText}–${highText}`;
}

/** Formats "YYYY", "YYYY-MM" or "YYYY-MM-DD" with only the parts it has. */
export function formatPartialDate(locale: Locale, date: string): string {
  const [year = 0, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  const options: Intl.DateTimeFormatOptions = { timeZone: "UTC", year: "numeric" };
  if (month !== undefined) {
    options.month = "short";
  }
  if (day !== undefined) {
    options.day = "numeric";
  }
  return new Intl.DateTimeFormat(localeTags[locale], options).format(utc);
}

/** Country or territory name from its ISO 3166-1 alpha-2 code: "FR" → "França". */
export function placeName(locale: Locale, code: string): string {
  return new Intl.DisplayNames([localeTags[locale]], { type: "region" }).of(code) ?? code;
}

/** Language name from a BCP 47 tag: "es" → "espanhol". */
export function languageName(locale: Locale, tag: string): string {
  return new Intl.DisplayNames([localeTags[locale]], { type: "language" }).of(tag) ?? tag;
}
