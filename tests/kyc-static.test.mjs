import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const readSource = (relative) =>
  readFileSync(new URL(relative, import.meta.url), "utf8").split("\r\n").join("\n")

const kycApi = readSource("../lib/api/kyc.ts")
const personalDashboard = readSource("../app/dashboard/personal/page.tsx")

test("Person KYC API client posts to /kyc/session with CreateKycSessionDto", () => {
  assert.match(kycApi, /import \{ type CreateKycSessionDto, type KycVerificationStatus \} from "@\/lib\/kyc"/)
  assert.match(kycApi, /request: CreateKycSessionDto/)
  assert.match(kycApi, /apiRequest<BackendKycVerificationEnvelope>\(\s*"\/kyc\/session",/)
})

test("Person KYC API client polls status via /verification/user/:id", () => {
  assert.match(kycApi, /`\/verification\/user\/\$\{encodeURIComponent\(userId\)\}`/)
  assert.match(kycApi, /\{ method: "GET" \}/)
})

test("Person KYC API client unwraps { verification } envelope", () => {
  assert.match(kycApi, /interface BackendKycVerificationEnvelope \{\s*verification: BackendKycVerification\s*\}/)
  assert.match(kycApi, /return data\.verification/)
  assert.match(kycApi, /failureReason: verification\.rejection_reason \?\? null/)
})

test("Person KYC client strictly avoids /identity-providers endpoint", () => {
  assert.doesNotMatch(kycApi, /identity-providers/)
  assert.doesNotMatch(personalDashboard, /identity-providers/)
})

test("Personal dashboard includes Person KYC UI entry point and session handling", () => {
  assert.match(personalDashboard, /import \{ getKycStatus, startKycSession \} from "@\/lib\/api\/kyc"/)
  assert.match(personalDashboard, /Identity Verification \(Person KYC\)/)
  assert.match(personalDashboard, /handleStartKycSession/)
  assert.match(personalDashboard, /refreshKycStatus/)
})
