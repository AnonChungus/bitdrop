# BitDrop 🪂

**The permissionless airdrop machine on Bitcoin L1.**

BitDrop lets anyone drop OP20 tokens to any list of Bitcoin addresses in a single transaction — powered by OPNet smart contracts.

## What it does

1. **Upload recipients** — Paste a CSV of `address,amount` pairs (up to 50 per campaign)
2. **Approve tokens** — One-click token approval via OP_WALLET
3. **Launch** — Single transaction creates the campaign and delivers tokens instantly

No off-chain trust. No custodians. Recorded forever on Bitcoin L1.

## Stack

- **Contract** — AssemblyScript OPNet smart contract (`AirdropRegistry`)
- **Backend** — HyperExpress REST API + MongoDB
- **Frontend** — React 18 + Vite + Tailwind CSS

## Setup

```bash
# Contracts
cd contracts && npm install && npm run build

# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

Set `AIRDROP_REGISTRY_ADDRESS` in `.env` after deploying the contract.

## Contest

Built for [vibecode.finance](https://vibecode.finance/) — OPNet Bitcoin hackathon, Week 1.

#opnetvibecode
