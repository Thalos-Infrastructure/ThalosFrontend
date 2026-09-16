import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const apiDir = path.resolve("lib/api")
const modules = ["agreements.ts", "disputes.ts", "escrow.ts", "kyb.ts", "wallets.ts"]

test("all API modules import the shared apiRequest helper", () => {
  for (const moduleFile of modules) {
    const source = fs.readFileSync(path.join(apiDir, moduleFile), "utf8")
    assert.match(
      source,
      /import \{ apiRequest, type ApiResponse \} from "\.\/client"/,
      `${moduleFile} must import apiRequest from ./client`,
    )
    assert.doesNotMatch(
      source,
      /function apiRequest/,
      `${moduleFile} must not define apiRequest locally`,
    )
    assert.doesNotMatch(
      source,
      /interface ApiResponse/,
      `${moduleFile} must not define ApiResponse locally`,
    )
  }
})
