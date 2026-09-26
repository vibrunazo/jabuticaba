import { describe, expect, it } from "vitest";
import { proseStructureProblem } from "./prose-structure.ts";

describe("proseStructureProblem", () => {
  it("accepts the full structure and the one without the optional section", () => {
    expect(
      proseStructureProblem(
        ["No Brasil", "Lá fora", "Por quê?", "Choque cultural", "Veredito"],
        "pt",
      ),
    ).toBeUndefined();
    expect(proseStructureProblem(["In Brazil", "Abroad", "Why?", "Verdict"], "en")).toBeUndefined();
  });

  it("reports missing, unexpected and out-of-order sections", () => {
    expect(proseStructureProblem(["No Brasil", "Por quê?", "Veredito"], "pt")).toContain("Lá fora");
    expect(proseStructureProblem(["No Brasil", "Lá fora", "Por quê?"], "pt")).toContain("Veredito");
    expect(proseStructureProblem(["Contexto"], "pt")).toContain("Contexto");
    expect(proseStructureProblem(["Lá fora", "No Brasil"], "pt")).toContain("No Brasil");
  });
});
