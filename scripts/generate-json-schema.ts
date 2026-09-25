/**
 * `pnpm schema [--check]`: writes schemas/item.schema.json from the Zod schema
 * (or, with --check, verifies it is up to date).
 */
import { itemJsonSchema } from "../src/schema/json-schema.ts";
import { writeOrCheck } from "./cli.ts";

if (!writeOrCheck("schemas/item.schema.json", itemJsonSchema(), "pnpm schema")) {
  process.exitCode = 1;
}
