import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(new URL("../lib/i18n.tsx", import.meta.url), "utf8")
  .split("\r\n")
  .join("\n")

/**
 * Returns the translation keys declared inside one language dictionary, in
 * source order. The dictionaries are plain object literals, so a line scan
 * between the `en: {` / `es: {` marker and its closing brace is enough — and it
 * stays honest if the file is reordered.
 */
const keysFor = (lang) => {
  const lines = source.split("\n")
  const start = lines.findIndex((l) => l.trimEnd() === `  ${lang}: {`)
  assert.notEqual(start, -1, `could not find the ${lang} dictionary`)

  const keys = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === "  },") break
    // Prettier reflows long values onto the next line, so the value may not
    // start on the key's line.
    const match = /^\s*"([^"]+)":/.exec(lines[i])
    if (match) keys.push(match[1])
  }
  assert.ok(keys.length > 100, `${lang} dictionary looks empty (${keys.length} keys)`)
  return keys
}

// A duplicate key is silently dropped by the object literal: the last one wins
// and every earlier translation becomes dead text nobody can reach. There were
// 97 of these, so this guards the cleanup rather than a hypothetical.
for (const lang of ["en", "es"]) {
  test(`${lang} translations declare no duplicate keys`, () => {
    const keys = keysFor(lang)
    const seen = new Set()
    const duplicates = []
    for (const key of keys) {
      if (seen.has(key)) duplicates.push(key)
      seen.add(key)
    }
    assert.deepEqual(duplicates, [], `duplicated ${lang} keys: ${duplicates.join(", ")}`)
  })
}

test("en and es declare the same set of keys", () => {
  const en = new Set(keysFor("en"))
  const es = new Set(keysFor("es"))
  const missingInEs = [...en].filter((k) => !es.has(k))
  const missingInEn = [...es].filter((k) => !en.has(k))
  assert.deepEqual({ missingInEs, missingInEn }, { missingInEs: [], missingInEn: [] })
})
