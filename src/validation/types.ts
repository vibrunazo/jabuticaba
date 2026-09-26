import type { Locale } from "../i18n/ui.ts";
import type { Item } from "../schema/item.ts";
import type { LocaleText } from "../schema/locale-text.ts";
import type { Place, SubdivisionReference } from "../schema/reference.ts";

export type Severity = "error" | "warning";

/** One validation finding. Codes are listed in docs/design/02-content-schema.md, section 10. */
export interface Problem {
  code: string;
  severity: Severity;
  /** Repository-relative path with forward slashes. */
  file: string;
  /** Location inside the file, e.g. `presence[3].place`. */
  path?: string;
  message: string;
  /** How to fix it, phrased as an instruction. */
  fix: string;
}

export interface LocaleTextFile {
  locale: Locale;
  file: string;
  text: LocaleText;
  body: string;
}

/** One `content/jabuticabas/<folder>/` directory. Files that failed to parse are absent. */
export interface ItemFolder {
  folderName: string;
  dir: string;
  fileNames: string[];
  item: Item | undefined;
  texts: LocaleTextFile[];
  /** Contents of research.md (internal notes), if the folder has one. */
  research: string | undefined;
}

export interface ContentSnapshot {
  items: ItemFolder[];
  places: Place[];
  /** Keyed by country code, e.g. "US". */
  subdivisions: Map<string, SubdivisionReference[]>;
  /** Place codes that can be drawn on the world map; undefined if the geometry is missing. */
  mapCodes: Set<string> | undefined;
}

export interface ValidationOptions {
  /** Production build: mock items are forbidden (J060). */
  production: boolean;
  /** Today's date as YYYY-MM-DD, injectable for tests. */
  today: string;
}
