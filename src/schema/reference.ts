/**
 * Schemas of the reference files in `content/reference/`.
 * Spec: docs/design/02-content-schema.md, section 7.
 */
import { z } from "zod";
import { locales } from "../i18n/ui.ts";
import { placeCodeSchema, subdivisionCodeSchema } from "./shared.ts";

export const placesSchema = z.array(
  z.strictObject({
    code: placeCodeSchema,
    sovereign: placeCodeSchema.optional(),
  }),
);
export type Place = z.infer<typeof placesSchema>[number];

/** Keys are all supported locales, so a missing translation fails validation (J026). */
export const subdivisionsFileSchema = z.array(
  z.strictObject({
    code: subdivisionCodeSchema,
    names: z.record(z.enum(locales), z.string().trim().min(1)),
  }),
);
export type SubdivisionReference = z.infer<typeof subdivisionsFileSchema>[number];
