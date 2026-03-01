# Thalos Frontend

Escrow and payments infrastructure built on the [Stellar](https://stellar.org) network. Thalos provides programmable escrows, protected fund management, and staged release workflows powered by [Trustlesswork](https://docs.trustlesswork.com/).

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/manueljgs-projects/v0-thalos-prototype-design)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Blockchain | Stellar SDK, Stellar Wallets Kit, Freighter API |
| Escrows | Trustlesswork API |
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

Create a `.env.local` file in the root directory. All variables are optional and have defaults:

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
├── components/                  # UI components (hero, navbar, FAQ, etc.)
├── hooks/                       # Custom React hooks
├── lib/
│   ├── config.ts                # Global constants (explorer URL, trustlines)
│   ├── i18n.tsx                 # Internationalization (EN/ES)
│   ├── stellar-wallet.tsx       # Wallet context provider
│   ├── stellar-wallet-kit.ts    # Stellar Wallets Kit initialization
│   ├── agreementActions.ts      # Escrow agreement CRUD via Trustlesswork
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

## Wallet Connection

Thalos uses the [Stellar Wallets Kit](https://github.com/nicofunke/stellar-wallets-kit) to provide a unified wallet connection modal. Supported wallets include Freighter, xBull, LOBSTR, Albedo, Rabet, and WalletConnect.

1. Click **Sign In** from the navbar.
2. Select your account type (Personal or Enterprise).
3. Click **Login with Wallet** -- a modal will appear with available wallets.
4. Approve the connection in your wallet extension.

Your connected wallet address is used for all escrow operations: funding agreements as a payer, or receiving released funds as a payee.

## Escrow System

Thalos integrates with the [Trustlesswork](https://docs.trustlesswork.com/) API to manage escrow agreements on the Stellar network. Key operations:

- **Create** agreements with defined milestones and parties
- **Fund** escrows by locking USDC into smart contracts
- **Release** funds at milestone completion
- **Dispute** resolution workflows

All transactions are signed client-side by the connected Stellar wallet.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (webpack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## License

Proprietary. All rights reserved by Thalos Infrastructure.
