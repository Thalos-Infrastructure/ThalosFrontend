import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'

const readSource = (relative) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8').split('\r\n').join('\n')

const reputationApi = readSource('../lib/api/reputation.ts')
const reputationComponent = readSource('../components/profile/reputation-summary.tsx')

test('Reputation API maps Nest backend snake_case fields correctly', () => {
  assert.match(reputationApi, /completed_agreements_count/)
  assert.match(reputationApi, /released_milestones_count/)
  assert.match(reputationApi, /total_released_usdc/)
  assert.match(reputationApi, /pr_backed_milestone_count/)
  assert.match(reputationApi, /github_verified/)
})

test('Reputation API uses shared apiRequest from client.ts', () => {
  assert.match(reputationApi, /import \{ apiRequest \} from "\.\/client"/)
  assert.match(reputationApi, /apiRequest<unknown>\(endpoint, \{ method: "GET" \}, target\.token\)/)
})

test('Reputation API preserves githubVerified as boolean | null (unknown vs false)', () => {
  assert.match(reputationApi, /githubVerified:\s*\(data\.github_verified \?\? data\.githubVerified\) \?\? null/)
})

test('Reputation API handles totalReleasedUsdc opt-out (null)', () => {
  assert.match(reputationApi, /totalReleasedUsdc:\s*rawUsdc != null \? Number\(rawUsdc\) : null/)
})

test('Reputation summary component checks exact true for githubVerified', () => {
  assert.match(reputationComponent, /reputation\.githubVerified === true/)
})

test('Reputation summary component displays earnings when totalReleasedUsdc != null', () => {
  assert.match(reputationComponent, /reputation\.totalReleasedUsdc != null/)
  assert.doesNotMatch(reputationComponent, /valueVisible/)
})

test('Connect showcase page stub at app/connect/[handle]/page.tsx is removed to prevent conflict with #143', () => {
  const stubPath = new URL('../app/connect/[handle]/page.tsx', import.meta.url)
  assert.equal(existsSync(stubPath), false, 'app/connect/[handle]/page.tsx should not exist')
})
