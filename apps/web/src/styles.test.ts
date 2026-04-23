import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readStylesRule(selector: string) {
  const stylesPath = fileURLToPath(new URL("./styles.css", import.meta.url));
  const stylesheet = readFileSync(stylesPath, "utf8");
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = stylesheet.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));

  expect(match, `Missing CSS rule for ${selector}`).not.toBeNull();

  return match![1];
}

describe("styles", () => {
  it("keeps the galaxy node panel opaque enough for in-app browsers", () => {
    const rule = readStylesRule(".galaxy-stage__node-panel");

    expect(rule).not.toMatch(/backdrop-filter\s*:/);
    expect(rule).toMatch(/rgba\(7,\s*11,\s*20,\s*0\.96\)/);
  });

  it("lays out the mobile overflow panel links without internal scrolling", () => {
    const rule = readStylesRule(".mobile-overflow-panel__content");

    expect(rule).toMatch(/grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(rule).not.toMatch(/overflow\s*:\s*auto/);
  });

  it("keeps the mobile overflow header and close button on their own row", () => {
    const rule = readStylesRule(".mobile-overflow-panel__header");

    expect(rule).toMatch(/grid-column\s*:\s*1\s*\/\s*-1/);
  });
});
