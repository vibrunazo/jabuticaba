/**
 * UI strings for every locale. `pt` is the reference: every other locale must
 * define exactly the same keys, which the type checker enforces.
 */

export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

/** BCP 47 tags for `<html lang>` and `Intl` APIs. */
export const localeTags: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
};

const pt = {
  "site.name": "Índice Jabuticaba®",
  "site.tagline": "Medindo, com rigor científico, o quão brasileiras as coisas são.",
  "home.placeholder": "Em construção. A metodologia está sendo revisada por pares.",
} as const;

export type UiKey = keyof typeof pt;

const en: Record<UiKey, string> = {
  "site.name": "Jabuticaba Index®",
  "site.tagline": "Measuring, with scientific rigor, how Brazilian things are.",
  "home.placeholder": "Under construction. The methodology is undergoing peer review.",
};

export const ui: Record<Locale, Record<UiKey, string>> = { pt, en };

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}
