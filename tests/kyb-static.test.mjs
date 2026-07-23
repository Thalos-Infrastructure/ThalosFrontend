import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const kyb = readFileSync(new URL('../lib/api/kyb.ts', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../app/dashboard/business/page.tsx', import.meta.url), 'utf8')

test('KYB API client posts the required CreateKybSessionDto body', () => {
  assert.match(kyb, /export interface KybSessionRequest[\s\S]*organization_id: string[\s\S]*business_name: string[\s\S]*registration_number: string[\s\S]*country: string[\s\S]*entity_type: string/)
  assert.match(kyb, /body: JSON\.stringify\(buildKybSessionBody\(request\)\)/)
  assert.match(kyb, /country: input\.country\.trim\(\)\.toUpperCase\(\)/)
})

test('KYB API client unwraps the backend verification envelope', () => {
  assert.match(kyb, /interface BackendKybVerificationEnvelope \{\n  verification: BackendKybVerification\n\}/)
  assert.match(kyb, /return "verification" in data \? data\.verification : data/)
  assert.match(kyb, /organizationId: verification\.organization_id/)
  assert.match(kyb, /failureReason: verification\.rejection_reason \?\? null/)
})

test('KYB API client uses shared apiRequest and expected endpoints', () => {
  assert.match(kyb, /import \{ apiRequest, type ApiResponse \} from "\.\/client"/)
  assert.match(kyb, /apiRequest<BackendKybVerificationEnvelope>\(\n    "\/kyb\/session",/)
  assert.match(kyb, /`\/kyb\/status\/\$\{encodeURIComponent\(organizationId\)\}`/)
  assert.match(kyb, /\{ method: "GET" \}/)
})

test('KYB API client maps all backend statuses', () => {
  for (const status of ['pending', 'in_review', 'verified', 'rejected']) {
    assert.match(kyb, new RegExp(status))
  }
})

test('business dashboard gates enterprise creation and fund release unless verified', () => {
  assert.match(dashboard, /const isKybVerified = kybStatus === "verified"/)
  assert.match(dashboard, /Enterprise agreement creation is blocked until your business verification is approved\./)
  assert.match(dashboard, /activePermissions\.release && isKybVerified/)
})

test('business dashboard builds KYB sessions from company profile fields', () => {
  assert.match(dashboard, /const profileOrganizationId = profileKybDetails\?\.organization_id \|\| companyProfile\?\.id \|\| null/)
  assert.match(dashboard, /organization_id: profileOrganizationId/)
  assert.match(dashboard, /business_name: profileKybDetails\.display_name/)
  assert.match(dashboard, /registration_number: profileKybDetails\.registration_number/)
  assert.match(dashboard, /country: profileKybDetails\.country/)
  assert.match(dashboard, /entity_type: profileKybDetails\.entity_type/)
})

test('business dashboard polls status with verification organization UUID and does not assume provider URLs', () => {
  assert.match(dashboard, /setKybOrganizationId\(result\.data\.organizationId\)/)
  assert.match(dashboard, /refreshKybStatus\(result\.data\.organizationId\)/)
  assert.doesNotMatch(dashboard, /redirectUrl \|\| result\.data\.verificationUrl \|\| result\.data\.embeddedUrl/)
  assert.match(dashboard, /Retry verification/)
})
