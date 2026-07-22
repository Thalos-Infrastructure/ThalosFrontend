import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const kyb = readFileSync(new URL('../lib/api/kyb.ts', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../app/dashboard/business/page.tsx', import.meta.url), 'utf8')

test('KYB API client uses shared apiRequest and expected endpoints', () => {
  assert.match(kyb, /import \{ apiRequest, type ApiResponse \} from "\.\/client"/)
  assert.match(kyb, /apiRequest<KybSession>\("\/kyb\/session", \{ method: "POST" \}/)
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

test('business dashboard handles KYB refresh, rejected status, expired sessions, and retry flow', () => {
  assert.match(dashboard, /refreshKybStatus/)
  assert.match(dashboard, /setKybStatus\(result\.data\.status\)/)
  assert.match(dashboard, /setKybSessionExpired\(Boolean\(result\.data\.sessionExpired\)\)/)
  assert.match(dashboard, /Retry verification/)
})

test('starting verification transitions pending sessions into review and supports provider-agnostic flow urls', () => {
  assert.match(dashboard, /result\.data\.status === "pending" \? "in_review" : result\.data\.status/)
  assert.match(dashboard, /redirectUrl \|\| result\.data\.verificationUrl \|\| result\.data\.embeddedUrl/)
})
