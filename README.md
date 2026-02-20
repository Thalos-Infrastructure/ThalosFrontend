# Thalos prototype design

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/manueljgs-projects/v0-thalos-prototype-design)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/O0Yt3KxRWMp)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/manueljgs-projects/v0-thalos-prototype-design](https://vercel.com/manueljgs-projects/v0-thalos-prototype-design)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/O0Yt3KxRWMp](https://v0.app/chat/O0Yt3KxRWMp)**

## Sign in & wallet connection

**Sign in:** Choose your account type (Personal or Enterprise), then use **Login with Wallet** to connect. A modal (Stellar Wallets Kit) opens so you can pick a supported Stellar wallet (e.g. Freighter, xBull, LOBSTR, Ledger, WalletConnect). After connecting, you’re taken to your profile.

**Profile & wallet:** Your connected wallet is shown in your profile and is the one used for all escrow actions: it funds the escrow when you’re the payer, or receives released funds when you’re the payee, depending on your role in each agreement.

**Escrows & Trustlesswork:** Thalos uses the [Trustlesswork](https://docs.trustlesswork.com/) APIs to create and manage escrow agreements on Stellar. Your wallet signs transactions (e.g. locking funds, releasing at milestones); the app talks to Trustlesswork for agreement lifecycle, escrow blocks, and on-chain execution.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
