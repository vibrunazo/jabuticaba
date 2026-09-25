/**
 * Generates schemas/item.schema.json from the Zod schema, for editor autocomplete
 * and inline validation. Pure function: no I/O.
 */
import { z } from "zod";
import { itemSchema } from "./item.ts";

export function itemJsonSchema(): string {
  const schema = z.toJSONSchema(itemSchema, { target: "draft-07", unrepresentable: "any" });
  return `${JSON.stringify(schema, null, 2)}\n`;
}
