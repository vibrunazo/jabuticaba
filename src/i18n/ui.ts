/**
 * UI strings for every locale. `pt` is the reference: every other locale must
 * define exactly the same keys, which the type checker enforces.
 *
 * Placeholders use braces, e.g. "{score}%", and are filled by `format()`.
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
  "site.tagline": "Categorizando as singularidades brasileiras. Da capivara ao precatório.",
  "site.description": "Medindo, com rigor científico, o quão brasileiras as coisas são.",
  "nav.switchLanguage": "English",
  "nav.toggleTheme": "Alternar tema claro/escuro",
  "ranking.title": "Classificação geral",
  "ranking.intro":
    "Coisas que só existem no Brasil, ou quase, ordenadas pelo Índice Jabuticaba®: de 0% (comum no mundo inteiro) a 100% (exclusivamente brasileiro).",
  "ranking.legendPoint": "Estimativa central",
  "ranking.legendRange": "Faixa de plausibilidade",
  "ranking.scoreLabel": "{score}%, faixa de plausibilidade de {low}% a {high}%",
  "ranking.empty": "Nenhuma jabuticaba publicada ainda. A pesquisa continua.",
  "badge.mock": "Dados fictícios",
  "badge.draft": "Rascunho",
  "badge.hiddenJabuticaba": "Jabuticaba oculta",
  "badge.evidenceGrade": "Evidência {grade}",
  "badge.untranslated": "Disponível só em português",
  "category.nature": "Natureza",
  "category.food": "Comida",
  "category.home": "Casa",
  "category.urban": "Cidade",
  "category.culture": "Cultura",
  "category.politics": "Política",
  "category.justice": "Justiça",
  "category.economy": "Economia",
  "footer.methodology": "Metodologia v{version}",
  "footer.license": "Dados, textos e código em domínio público (CC0).",
} as const;

export type UiKey = keyof typeof pt;

const en: Record<UiKey, string> = {
  "site.name": "Jabuticaba Index®",
  "site.tagline": "Categorizing Brazilian singularities. From the capybara to the precatório.",
  "site.description": "Measuring, with scientific rigor, how Brazilian things are.",
  "nav.switchLanguage": "Português",
  "nav.toggleTheme": "Toggle light/dark theme",
  "ranking.title": "Overall ranking",
  "ranking.intro":
    "Things that exist only in Brazil, or almost, ranked by the Jabuticaba Index®: from 0% (common worldwide) to 100% (exclusively Brazilian).",
  "ranking.legendPoint": "Central estimate",
  "ranking.legendRange": "Plausibility range",
  "ranking.scoreLabel": "{score}%, plausibility range {low}% to {high}%",
  "ranking.empty": "No jabuticabas published yet. Research continues.",
  "badge.mock": "Fictional data",
  "badge.draft": "Draft",
  "badge.hiddenJabuticaba": "Hidden jabuticaba",
  "badge.evidenceGrade": "Evidence {grade}",
  "badge.untranslated": "Only available in Portuguese",
  "category.nature": "Nature",
  "category.food": "Food",
  "category.home": "Home",
  "category.urban": "Urban",
  "category.culture": "Culture",
  "category.politics": "Politics",
  "category.justice": "Justice",
  "category.economy": "Economy",
  "footer.methodology": "Methodology v{version}",
  "footer.license": "Data, texts and code in the public domain (CC0).",
};

export const ui: Record<Locale, Record<UiKey, string>> = { pt, en };

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}

/** Translates `key` and fills its `{name}` placeholders. Unknown placeholders are left as-is. */
export function format(
  locale: Locale,
  key: UiKey,
  values: Record<string, string | number>,
): string {
  return t(locale, key).replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}

/** Site path for a locale: `localizedPath("en", "/")` → "/en/". `path` starts with "/". */
export function localizedPath(locale: Locale, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}
