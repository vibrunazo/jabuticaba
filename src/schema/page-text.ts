/**
 * Frontmatter of `content/pages/<page-id>/<locale>.md` (fixed pages such as the
 * methodology). The body is Markdown and may use {{PLACEHOLDERS}} (see
 * src/site/placeholders.ts).
 */
import { z } from "zod";
import { TRANSLATION_STATUSES } from "./locale-text.ts";

export const pageTextSchema = z.strictObject({
  translationStatus: z.enum(TRANSLATION_STATUSES),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(300),
  /** Date the text was last revised, YYYY-MM-DD. */
  updated: z.iso.date(),
});
export type PageText = z.infer<typeof pageTextSchema>;
