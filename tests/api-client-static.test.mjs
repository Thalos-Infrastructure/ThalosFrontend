import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const apiDir = path.resolve("lib/api")
const modules = ["agreements.ts", "disputes.ts", "escrow.ts", "kyb.ts", "notifications.ts", "wallets.ts"]

test("all API modules import the shared apiRequest helper", () => {
  for (const module of modules) {
    const source = fs.readFileSync(path.join(apiDir, module), "utf8")
    assert.match(
      source,
      /import \{ apiRequest, type ApiResponse \} from "\.\/client"/,
      `${module} must import apiRequest from ./client`,
    )
    assert.doesNotMatch(source, /function apiRequest/, `${module} must not define apiRequest locally`)
    assert.doesNotMatch(source, /interface ApiResponse/, `${module} must not define ApiResponse locally`)
  }
})
