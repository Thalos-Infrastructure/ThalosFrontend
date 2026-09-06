import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildCreateKycSessionDto,
  canStartKycSession,
  isKycVerified,
  nextKycStatusAfterSessionStart,
} from "../lib/kyc.ts"

test("canStartKycSession requires full_name and country", () => {
  assert.equal(canStartKycSession({ full_name: "Jane Doe", country: "US" }), true)
  assert.equal(canStartKycSession({ full_name: "Jane Doe", country: "" }), false)
  assert.equal(canStartKycSession({ full_name: "", country: "US" }), false)
  assert.equal(canStartKycSession(null), false)
})

test("buildCreateKycSessionDto trims and submits the valid DTO shape", () => {
  assert.deepEqual(
    buildCreateKycSessionDto("GABC123", "usr_123", { full_name: " Jane Doe ", country: " US " }),
    { wallet_address: "GABC123", user_id: "usr_123", full_name: "Jane Doe", country: "US" },
  )
})

test("KYC gating flow status checks", () => {
  assert.equal(nextKycStatusAfterSessionStart(), "in_review")
  assert.equal(isKycVerified("not_started"), false)
  assert.equal(isKycVerified("in_review"), false)
  assert.equal(isKycVerified("pending"), false)
  assert.equal(isKycVerified("rejected"), false)
  assert.equal(isKycVerified("verified"), true)
})
