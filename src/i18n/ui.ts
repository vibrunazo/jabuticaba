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
  "footer.about": "Um índice de dados abertos sobre as singularidades brasileiras.",
  "nav.backToRanking": "Classificação geral",
  "ranking.rank": "{rank}º",
  "ranking.eyebrow": "Edição 2026 · Metodologia v{version} · {count} itens",
  "item.rankOf": "{rank}º de {total}",
  "item.rangeLabel": "Faixa de plausibilidade: {range}%",
  "item.evidenceGrade": "Grau de evidência",
  "item.evidenceGradeHint":
    "Calculado pelos tipos de fonte: de A (dados oficiais e acadêmicos) a D (avaliação editorial). Não altera o índice.",
  "item.machineTranslation": "Tradução automática, ainda não revisada.",
  "item.since": "Desde {year}",
  "item.definitionTitle": "O que exatamente está sendo medido",
  "item.articleTitle": "Contexto",
  "item.mapTitle": "Onde mais existe",
  "item.mapCaption":
    "Projeção Equal Earth. Lugares com presença incerta aparecem com a cor do nível mais alto possível; a tabela mostra a faixa completa.",
  "item.mapAlone": "Não foi encontrado em nenhum outro lugar pesquisado.",
  "item.projection": "Projeção",
  "item.tablePlace": "Lugar",
  "item.tablePresence": "Presença",
  "item.tableWeight": "Peso",
  "item.tableSources": "Fontes",
  "item.territoryOf": "{sovereign} ({territory})",
  "item.subdivisionsTitle": "Por estado ou província",
  "item.breakdownTitle": "Como chegamos a este número",
  "item.placeCount": "Presença no exterior",
  "item.placeCountHint":
    "Soma dos pesos de cada lugar: ampla = {widespread}, regional = {regional}, marginal = {marginal}. Onde só existe por exportação brasileira, o peso é multiplicado por {exportFactor}.",
  "item.exclusivity": "Exclusividade",
  "item.exclusivityHint": "De 0 (existe em toda parte) a 1 (só no Brasil), em escala logarítmica.",
  "item.intensity": "Intensidade",
  "item.intensityHint": "O quanto é mais comum no Brasil do que nos outros lugares onde existe.",
  "item.ratingOf": "{value} de 4",
  "item.ratio": "Razão de prevalência: {ratio}×",
  "item.rarity": "Coeficiente de raridade",
  "item.index": "Índice Jabuticaba®",
  "item.notScored": "Não entra no cálculo",
  "item.awareness": "Consciência",
  "item.awarenessHint": "O quanto os brasileiros sabem que isso é raro lá fora.",
  "item.editorial": "avaliação editorial",
  "item.sourcesTitle": "Fontes",
  "item.accessed": "acesso em {date}",
  "item.archive": "cópia arquivada",
  "item.inLanguage": "em {language}",
  "item.relatedTitle": "Veja também",
  "item.lastReviewed": "Última revisão em {date} · Metodologia v{version}",
  "level.widespread": "Ampla",
  "level.regional": "Regional",
  "level.marginal": "Marginal",
  "item.exported": "exportação brasileira",
  "legend.local": "Presença local",
  "legend.exported": "Exportado do Brasil",
  "level.absent": "Ausente (verificado)",
  "level.noData": "Sem dados",
  "level.brazil": "Brasil",
  "projection.brazil-centered": "Soberana",
  "projection.standard": "Colonial",
  "sourceType.dataset": "Dados estatísticos",
  "sourceType.government": "Documento oficial",
  "sourceType.academic": "Acadêmico",
  "sourceType.organization": "Organização",
  "sourceType.reference": "Obra de referência",
  "sourceType.news": "Imprensa",
  "sourceType.other": "Outros",
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
  "footer.about": "An open-data index of Brazilian singularities.",
  "nav.backToRanking": "Overall ranking",
  "ranking.rank": "#{rank}",
  "ranking.eyebrow": "2026 edition · Methodology v{version} · {count} items",
  "item.rankOf": "#{rank} of {total}",
  "item.rangeLabel": "Plausibility range: {range}%",
  "item.evidenceGrade": "Evidence grade",
  "item.evidenceGradeHint":
    "Computed from source types: from A (official and academic data) to D (editorial judgment). It does not change the index.",
  "item.machineTranslation": "Machine translation, not yet reviewed.",
  "item.since": "Since {year}",
  "item.definitionTitle": "What exactly is being measured",
  "item.articleTitle": "Context",
  "item.mapTitle": "Where else it exists",
  "item.mapCaption":
    "Equal Earth projection. Places with uncertain presence take the color of the highest possible level; the table shows the full range.",
  "item.mapAlone": "Not found anywhere else surveyed.",
  "item.projection": "Projection",
  "item.tablePlace": "Place",
  "item.tablePresence": "Presence",
  "item.tableWeight": "Weight",
  "item.tableSources": "Sources",
  "item.territoryOf": "{sovereign} ({territory})",
  "item.subdivisionsTitle": "By state or province",
  "item.breakdownTitle": "How we got this number",
  "item.placeCount": "Presence abroad",
  "item.placeCountHint":
    "Sum of each place's weight: widespread = {widespread}, regional = {regional}, marginal = {marginal}. Where it only exists as a Brazilian export, the weight is multiplied by {exportFactor}.",
  "item.exclusivity": "Exclusivity",
  "item.exclusivityHint": "From 0 (exists everywhere) to 1 (only in Brazil), on a log scale.",
  "item.intensity": "Intensity",
  "item.intensityHint":
    "How much more common it is in Brazil than in the other places where it exists.",
  "item.ratingOf": "{value} of 4",
  "item.ratio": "Prevalence ratio: {ratio}×",
  "item.rarity": "Rarity coefficient",
  "item.index": "Jabuticaba Index®",
  "item.notScored": "Not part of the score",
  "item.awareness": "Awareness",
  "item.awarenessHint": "How aware Brazilians are that this is rare abroad.",
  "item.editorial": "editorial judgment",
  "item.sourcesTitle": "Sources",
  "item.accessed": "accessed {date}",
  "item.archive": "archived copy",
  "item.inLanguage": "in {language}",
  "item.relatedTitle": "See also",
  "item.lastReviewed": "Last reviewed {date} · Methodology v{version}",
  "level.widespread": "Widespread",
  "level.regional": "Regional",
  "level.marginal": "Marginal",
  "item.exported": "Brazilian export",
  "legend.local": "Local presence",
  "legend.exported": "Exported from Brazil",
  "level.absent": "Absent (checked)",
  "level.noData": "No data",
  "level.brazil": "Brazil",
  "projection.brazil-centered": "Sovereign",
  "projection.standard": "Colonial",
  "sourceType.dataset": "Statistical data",
  "sourceType.government": "Official document",
  "sourceType.academic": "Academic",
  "sourceType.organization": "Organization",
  "sourceType.reference": "Reference work",
  "sourceType.news": "News",
  "sourceType.other": "Other",
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
