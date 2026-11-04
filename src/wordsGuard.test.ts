// DT203 release 2 (0.3.77): no new screen word goes straight into the code. Each file may hold at most the words it held when
// docs/rules/words-baseline.json was last written; a new word goes into src/i18n/en.json (and gets its Serbian in the table).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { files, count } = req("../scripts/words-baseline.cjs");
const base = JSON.parse(readFileSync(new URL("../docs/rules/words-baseline.json", import.meta.url), "utf8")) as Record<string, number>;

test("no file holds more screen words in its code than before", () => {
  const more: string[] = [];
  for (const f of files() as string[]) { const n = count(readFileSync(new URL(`../${f}`, import.meta.url), "utf8")); if (n > (base[f] ?? 0)) more.push(`${f}: ${n} (was ${base[f] ?? 0})`); }
  assert.deepEqual(more, [], "new words belong in src/i18n/en.json; after moving words, node scripts/words-baseline.cjs");
});

