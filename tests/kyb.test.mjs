import assert from "node:assert/strict"
import { test } from "node:test"
import {
  KYB_ENTITY_TYPES,
  buildCreateKybSessionDto,
  canStartKybSession,
  isKybEntityType,
  isKybVerified,
  nextKybStatusAfterSessionStart,
} from "../lib/kyb.ts"

test("KYB entity_type only allows the reviewer-approved values", () => {
  assert.deepEqual([...KYB_ENTITY_TYPES], ["company", "startup", "organization", "legal_entity"])
  assert.equal(isKybEntityType("company"), true)
  assert.equal(isKybEntityType("sole_proprietor"), false)
})

test("canStartKybSession requires all CreateKybSessionDto fields", () => {
  assert.equal(
    canStartKybSession({
      business_name: "Acme",
      registration_number: "123",
      country: "US",
      entity_type: "company",
    }),
    true,
  )
  assert.equal(
    canStartKybSession({
      business_name: "Acme",
      registration_number: "123",
      country: "US",
      entity_type: null,
    }),
    false,
  )
  assert.equal(
    canStartKybSession({
      business_name: "Acme",
      registration_number: "",
      country: "US",
      entity_type: "company",
    }),
    false,
  )
})

test("buildCreateKybSessionDto trims and submits the valid DTO shape", () => {
  assert.deepEqual(
    buildCreateKybSessionDto("GABC", {
      business_name: " Acme ",
      registration_number: " 123 ",
      country: " US ",
      entity_type: "startup",
    }),
    {
      wallet_address: "GABC",
      business_name: "Acme",
      registration_number: "123",
      country: "US",
      entity_type: "startup",
    },
  )
})

test("KYB gating flow stays blocked until verified", () => {
  assert.equal(nextKybStatusAfterSessionStart(), "in_review")
  assert.equal(isKybVerified("not_started"), false)
  assert.equal(isKybVerified("in_review"), false)
  assert.equal(isKybVerified("verified"), true)
})
