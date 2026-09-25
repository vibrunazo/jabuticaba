/**
 * Schema of the frontmatter of `content/jabuticabas/<id>/<locale>.md`.
 * Spec: docs/design/02-content-schema.md, section 5.
 */
import { z } from "zod";
import { idSchema, placeCodeSchema, subdivisionCodeSchema } from "./shared.ts";

export const TRANSLATION_STATUSES = ["original", "machine", "reviewed"] as const;

const text = (maxLength: number) => z.string().trim().min(1).max(maxLength);

export const localeTextSchema = z.strictObject({
  translationStatus: z.enum(TRANSLATION_STATUSES),
  slug: idSchema,
  title: text(80),
  summary: text(200),
  definition: text(400),
  justifications: z.strictObject({
    intensity: text(2000),
    awareness: text(2000),
  }),
  presenceNotes: z.record(placeCodeSchema, text(1000)).optional(),
  subdivisionNotes: z.record(subdivisionCodeSchema, text(1000)).optional(),
  /** Describes the cover image for screen readers; required when item.json has an image. */
  imageAlt: text(250).optional(),
});
export type LocaleText = z.infer<typeof localeTextSchema>;
