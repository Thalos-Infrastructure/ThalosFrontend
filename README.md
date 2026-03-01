# Thalos

Thalos is an escrow orchestration layer built on the [Stellar](https://stellar.org) network.
It connects transparently with the [Trustless Work](https://docs.trustlesswork.com/) protocol to offer programmable agreements and milestone-based payments -- simple and secure, designed for end users who need to protect their transactions without dealing with blockchain complexity.

---

## What is Thalos

Thalos is a platform that lets freelancers, businesses, and everyday users create escrow agreements in minutes. You define milestones, fund the escrow, and funds are released only when both parties agree the work is done. No intermediaries, no trust required -- the Stellar network handles settlement in seconds.

**Key features:**

- Programmable escrow agreements with milestone-based releases
- Wallet-based authentication (no passwords, no accounts to manage)
- Real-time dashboards for personal and business accounts
- Built-in dispute resolution workflows
- Bilingual interface (English / Spanish)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Blockchain | Stellar SDK, Stellar Wallets Kit, Freighter API |
| Escrows | Trustless Work API |
| Charts | Recharts |
| Deployment | Vercel |

## Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm
- A Stellar wallet browser extension ([Freighter](https://www.freighter.app/), xBull, LOBSTR, etc.)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Thalos-Infrastructure/ThalosFrontend.git
cd ThalosFrontend
```

### 2. Install dependencies

```bash
pnpm install
```

Or with npm:

```bash
npm install
```

### 3. Environment variables (optional)

Create a `.env.local` file in the root directory. All variables are optional and have working defaults:

```env
# Stellar block explorer base URL (defaults to testnet)
NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet/contract/

# Show mock agreements in the UI for development (defaults to true)
NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS=true
```

### 4. Run the development server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
pnpm build
pnpm start
```

## Project Structure

```
ThalosFrontend/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── about/page.tsx           # About Thalos
│   ├── admin/page.tsx           # Admin dashboard
│   └── dashboard/
│       ├── personal/page.tsx    # Personal account dashboard
│       └── business/page.tsx    # Business account dashboard
├── components/                  # UI components
├── hooks/                       # Custom React hooks
├── lib/
│   ├── config.ts                # Global constants
│   ├── i18n.tsx                 # Internationalization (EN/ES)
│   ├── stellar-wallet.tsx       # Wallet context provider
│   ├── stellar-wallet-kit.ts    # Stellar Wallets Kit initialization
│   ├── agreementActions.ts      # Escrow agreement operations via Trustless Work
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

## Wallet Connection

Thalos uses the [Stellar Wallets Kit](https://github.com/nicofunke/stellar-wallets-kit) to provide a unified connection modal. Supported wallets include Freighter, xBull, LOBSTR, Albedo, Rabet, and WalletConnect.

1. Click **Sign In** from the navbar.
2. Select your account type (Personal or Enterprise).
3. Click **Login with Wallet** and choose your wallet from the modal.
4. Approve the connection in your wallet extension.

Your connected address is used for all escrow operations: funding agreements as a payer, or receiving released funds as a payee.

## How Escrows Work

Thalos orchestrates escrow agreements through the [Trustless Work](https://docs.trustlesswork.com/) protocol on Stellar. The platform handles the complexity; you just define the terms.

1. **Create** -- Define an agreement with milestones, amounts, and counterparties.
2. **Fund** -- Lock USDC into the escrow smart contract.
3. **Release** -- Funds are released as each milestone is completed and approved.
4. **Dispute** -- If something goes wrong, the built-in dispute flow protects both parties.

All transactions are signed client-side by your Stellar wallet. Thalos never holds your keys or your funds.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Links

- [Instagram](https://www.instagram.com/thalos_platform)
- [Trustless Work Documentation](https://docs.trustlesswork.com/)
- [Stellar Network](https://stellar.org)

## License

All rights reserved by Thalos.
