import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const kyb = readFileSync(new URL('../lib/api/kyb.ts', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../app/dashboard/business/page.tsx', import.meta.url), 'utf8')

test('KYB API client posts the full CreateKybSessionDto body', () => {
  assert.match(kyb, /import \{ type CreateKybSessionDto \} from "@\/lib\/kyb"/)
  assert.match(kyb, /request: CreateKybSessionDto/)
  assert.match(kyb, /body: JSON\.stringify\(request\)/)
})

test('KYB API client unwraps the backend verification envelope', () => {
  assert.match(kyb, /interface BackendKybVerificationEnvelope \{\n  verification: BackendKybVerification\n\}/)
  assert.match(kyb, /return data\.verification/)
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
  assert.match(dashboard, /const kybVerified = isKybVerified\(companyProfile\?\.kyb_status\)/)
  assert.match(dashboard, /Enterprise agreement creation is blocked until your business verification is approved\./)
  assert.match(dashboard, /activePermissions\.release && kybVerified/)
})

test('business dashboard builds KYB sessions from company profile fields', () => {
  assert.match(dashboard, /const profileOrganizationId = companyProfile\?\.id \?\? null/)
  assert.match(dashboard, /const kybSessionDto = buildCreateKybSessionDto\(currentWorkspaceWallet, kybFields\)/)
  assert.match(dashboard, /const session = await startKybSession\(kybSessionDto, token\)/)
})

test('business dashboard polls status with verification organization UUID and does not assume provider URLs', () => {
  assert.match(dashboard, /setKybOrganizationId\(profileOrganizationId\)/)
  assert.match(dashboard, /refreshKybStatus\(profileOrganizationId\)/)
  assert.doesNotMatch(dashboard, /redirectUrl \|\| result\.data\.verificationUrl \|\| result\.data\.embeddedUrl/)
})
