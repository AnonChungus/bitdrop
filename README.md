# OpDrop 📡

**The neon airdrop machine on Bitcoin L1.**

OpDrop lets anyone broadcast OP20 tokens to any list of Bitcoin addresses in a single transaction — powered by OPNet smart contracts. No off-chain trust. No custodians. Carved into Bitcoin forever.

## What it does

1. **Load the Crew** — Paste a CSV of `address,amount` pairs (up to 50 per transmission)
2. **Authorize** — One-click token approval via OP_WALLET
3. **Broadcast** — Single transaction delivers tokens instantly to every wallet

No claiming required. No trust assumptions. Recorded on Bitcoin L1.

## Stack

- **Contract** — AssemblyScript OPNet smart contract (`AirdropRegistry`)
- **Backend** — HyperExpress REST API + MongoDB
- **Frontend** — React 18 + Vite + Tailwind CSS (80s Miami Vice aesthetic)

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
