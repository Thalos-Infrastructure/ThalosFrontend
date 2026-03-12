# Thalos Database Schema

Documentation for the Supabase database schema used by Thalos.

## Overview

Thalos uses Supabase (PostgreSQL) for persistent storage of user profiles, agreements, bounties, and disputes. All tables have Row Level Security (RLS) enabled.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────────┐       ┌─────────────┐
│  profiles   │───────│agreement_participants│───────│ agreements  │
└─────────────┘       └─────────────────────┘       └─────────────┘
      │                                                    │
      │                                                    │
      │               ┌─────────────────────┐              │
      │               │ agreement_activity  │──────────────┘
      │               └─────────────────────┘
      │
      │               ┌─────────────┐       ┌───────────────────┐
      └───────────────│  disputes   │───────│dispute_resolutions│
      │               └─────────────┘       └───────────────────┘
      │
      │               ┌─────────────┐       ┌───────────────────┐
      └───────────────│  bounties   │───────│ bounty_validators │
                      └─────────────┘       └───────────────────┘
                             │
                             │              ┌───────────────────┐
                             └──────────────│bounty_submissions │
                                            └───────────────────┘
```

---

## Tables

### profiles

User profiles created automatically on wallet connection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `wallet_address` | text | Stellar wallet address (unique) |
| `display_name` | text | User's display name |
| `email` | text | Optional email |
| `avatar_url` | text | URL to avatar image |
| `account_type` | text | 'personal' or 'business' |
| `role` | text | 'user', 'validator', 'dispute_resolver', 'admin' |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes:** `wallet_address` (unique)

---

### agreements

Agreements synced from Trustless Work API.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `contract_id` | text | Trustless Work contract ID (unique) |
| `title` | text | Agreement title |
| `description` | text | Agreement description |
| `amount` | decimal | Total amount in USDC |
| `status` | text | 'pending', 'active', 'completed', 'disputed', 'cancelled', 'resolved' |
| `milestones` | jsonb | Array of milestone objects |
| `service_provider` | text | Payee wallet address |
| `engagement_worker` | text | Payer wallet address |
| `platform_address` | text | Platform fee address |
| `release_signer` | text | Approver wallet address |
| `dispute_resolver` | text | Dispute resolver wallet address |
| `created_by` | uuid | Profile ID of creator |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes:** `contract_id` (unique), `created_by`, `status`

---

### agreement_participants

Links profiles to agreements with roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `agreement_id` | uuid | FK to agreements |
| `profile_id` | uuid | FK to profiles |
| `role` | text | 'payer', 'payee', 'approver', 'dispute_resolver' |
| `created_at` | timestamptz | Creation timestamp |

**Indexes:** `agreement_id`, `profile_id`
**Unique:** `(agreement_id, profile_id, role)`

---

### agreement_activity

Activity log for all agreement actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `agreement_id` | uuid | FK to agreements |
| `actor_wallet` | text | Wallet that performed the action |
| `action` | text | Action type (created, funded, milestone_released, etc.) |
| `details` | jsonb | Additional details |
| `created_at` | timestamptz | Creation timestamp |

**Indexes:** `agreement_id`, `created_at`

---

### bounties

Multi-validator bounty agreements with shareable links.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `slug` | text | URL-friendly identifier (unique) |
| `title` | text | Bounty title |
| `description` | text | Bounty description |
| `amount` | decimal | Total amount in USDC |
| `status` | text | 'draft', 'open', 'in_progress', 'completed', 'cancelled' |
| `agreement_id` | uuid | FK to agreements (optional) |
| `contract_id` | text | Trustless Work contract ID |
| `created_by` | uuid | FK to profiles |
| `min_validators` | int | Minimum validators required for approval |
| `deadline` | timestamptz | Optional deadline |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes:** `slug` (unique), `created_by`, `status`

**Slug generation:** `{title-slug}-{4-char-hash}` (e.g., `design-logo-a7f3`)

---

### bounty_validators

Validators assigned to bounties.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `bounty_id` | uuid | FK to bounties |
| `profile_id` | uuid | FK to profiles |
| `status` | text | 'pending', 'accepted', 'rejected' |
| `created_at` | timestamptz | Creation timestamp |

**Unique:** `(bounty_id, profile_id)`

---

### bounty_submissions

Submissions for bounty work.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `bounty_id` | uuid | FK to bounties |
| `submitter_id` | uuid | FK to profiles |
| `content` | text | Submission content/description |
| `attachments` | jsonb | Array of attachment URLs |
| `status` | text | 'pending', 'approved', 'rejected' |
| `approved_by` | uuid | FK to profiles (validator who approved) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes:** `bounty_id`, `submitter_id`, `status`

---

### disputes

Dispute records for agreements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `agreement_id` | uuid | FK to agreements |
| `opened_by` | uuid | FK to profiles |
| `reason` | text | Reason for dispute |
| `evidence` | jsonb | Array of evidence items |
| `status` | text | 'open', 'under_review', 'resolved' |
| `resolver_id` | uuid | FK to profiles (assigned resolver) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes:** `agreement_id`, `opened_by`, `resolver_id`, `status`

---

### dispute_resolutions

Resolution records with fund distribution.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `dispute_id` | uuid | FK to disputes |
| `resolved_by` | uuid | FK to profiles (resolver) |
| `resolution_notes` | text | Explanation of decision |
| `payer_percentage` | int | Percentage of funds to payer (0-100) |
| `payee_percentage` | int | Percentage of funds to payee (0-100) |
| `created_at` | timestamptz | Creation timestamp |

**Constraint:** `payer_percentage + payee_percentage = 100`

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### profiles
- Users can read/update their own profile
- Public read access for all profiles (for displaying names/avatars)

### agreements
- Participants can read agreements they're part of
- Creator can update their agreements

### bounties
- Public read access for open bounties
- Creator can update their bounties

### disputes
- Participants and resolver can read disputes
- Only assigned resolver can update/resolve

---

## Migration Scripts

Located in `/scripts/`:

| Script | Description |
|--------|-------------|
| `001_create_profiles.sql` | Profiles table with wallet-based auth |
| `002_create_agreements.sql` | Agreements and participants tables |
| `003_create_bounties.sql` | Bounties, validators, submissions tables |
| `004_create_disputes.sql` | Disputes and resolutions tables |
| `005_create_agreement_activity.sql` | Activity logging table |

---

## Common Queries

### Get user profile by wallet
```sql
SELECT * FROM profiles WHERE wallet_address = 'G...';
```

### Get agreements for a user
```sql
SELECT a.* FROM agreements a
JOIN agreement_participants ap ON a.id = ap.agreement_id
JOIN profiles p ON ap.profile_id = p.id
WHERE p.wallet_address = 'G...';
```

### Get open bounties
```sql
SELECT * FROM bounties WHERE status = 'open' ORDER BY created_at DESC;
```

### Get bounty by slug (for shareable links)
```sql
SELECT * FROM bounties WHERE slug = 'design-logo-a7f3';
```

### Get disputes needing resolution
```sql
SELECT d.*, a.title as agreement_title
FROM disputes d
JOIN agreements a ON d.agreement_id = a.id
WHERE d.status = 'open' AND d.resolver_id IS NULL;
```

---

## Environment Variables

Required for Supabase connection (auto-configured via Vercel integration):

```
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```
