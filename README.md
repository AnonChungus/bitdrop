# OpDrop

**OP20 airdrop platform on Bitcoin L1, powered by OPNet smart contracts.**

OpDrop lets anyone airdrop OP20 tokens to any list of Bitcoin Taproot addresses — in a single transaction. No off-chain trust. No custodians. No claiming. Every distribution is recorded permanently on Bitcoin.

---

## What It Does

1. **Connect** — Link your OP_WALLET (Taproot address: `bc1p...`)
2. **Select token** — Enter any OP20 contract address
3. **Load recipients** — Paste a CSV, upload a file, or pick a premade list (Motocats, Bitcoin Puppets, NodeMonkes, and more)
4. **Approve + Send** — Approve the OP20 spend, then execute the batch airdrop transaction
5. **Done** — Every recipient receives tokens instantly, on-chain, no action required on their end

Large lists are automatically split into batches of 200 recipients per transaction, with a progress bar tracking each batch.

---

## Key Features

- **Unlimited recipients** — 10,000+ addresses supported via automatic client-side batching
- **Premade community lists** — One-click load for 7 major ordinal collections via Magic Eden API:
  - Motocats (~3,300 holders)
  - Bitcoin Puppets (~10,000 holders)
  - NodeMonkes (~10,000 holders)
  - Ordinal Maxi Biz (~5,000 holders)
  - Quantum Cats (~3,333 holders)
  - Bitcoin Frogs (~10,000 holders)
  - Taproot Wizards (~2,108 holders)
- **Real cost estimates** — Shows exact sat cost before signing (typical: ~100–300 sats per 200-recipient batch at 2 sat/vB)
- **OP20-native** — Works with any OPNet OP20 token; uses `transferFrom` for trustless pulls
- **Push model** — Recipients don't need to claim anything; tokens arrive in their wallet

---

## Architecture

```
User Wallet (OP_WALLET)
      |
      | signInteraction
      v
AirdropRegistry.wasm  ←— AssemblyScript OPNet Smart Contract
      |
      | Blockchain.call → transferFrom(caller → contract)
      | Blockchain.call → transfer(contract → recipient) × N
      v
OP20 Token Contract

      ↑ Indexed by
Backend (HyperExpress + MongoDB)
      |
      | REST + WebSocket
      v
Frontend (React + Vite + Tailwind)
```

**Write ops** (create airdrop): Frontend → OP_WALLET → OPNet directly
**Read ops** (history, stats): Frontend → Backend (MongoDB cache)

---

## Smart Contract — AirdropRegistry

**Language**: AssemblyScript compiled to WASM
**Runtime**: `@btc-vision/btc-runtime`
**Deployment**: Bitcoin L1 via Tapscript-encoded calldata (NOT OP_RETURN, NOT inscriptions)

### ABI

```json
{
  "functions": [
    {
      "name": "createCampaign",
      "inputs": [
        { "name": "token",   "type": "ADDRESS" },
        { "name": "entries", "type": "ADDRESS_UINT256_TUPLE" }
      ],
      "outputs": [
        { "name": "campaignId", "type": "UINT256" }
      ]
    },
    {
      "name": "getCampaign",
      "inputs":  [{ "name": "campaignId", "type": "UINT256" }],
      "outputs": [
        { "name": "creator",        "type": "BYTES32"  },
        { "name": "token",          "type": "BYTES32"  },
        { "name": "totalAmount",    "type": "UINT256"  },
        { "name": "recipientCount", "type": "UINT32"   },
        { "name": "blockHeight",    "type": "UINT256"  }
      ]
    },
    {
      "name": "getCampaignCount",
      "inputs":  [],
      "outputs": [{ "name": "count", "type": "UINT256" }]
    }
  ],
  "events": [
    {
      "name": "CampaignCreated",
      "values": [
        { "name": "campaignId",     "type": "UINT256" },
        { "name": "creator",        "type": "ADDRESS" },
        { "name": "token",          "type": "ADDRESS" },
        { "name": "totalAmount",    "type": "UINT256" },
        { "name": "recipientCount", "type": "UINT32"  }
      ]
    }
  ]
}
```

### How `createCampaign` works

1. Caller pre-approves `totalAmount` of the OP20 token to the AirdropRegistry contract address
2. `createCampaign(token, [(addr1, amt1), (addr2, amt2), ...])` is called
3. Contract calls `transferFrom(caller, contract, totalAmount)` to pull the tokens
4. Contract calls `transfer(recipientN, amtN)` for each recipient
5. Stores campaign metadata (creator, token, totalAmount, recipientCount, blockHeight)
6. Emits `CampaignCreated` event
7. Returns the new `campaignId`

All token math uses `SafeMath` — no overflow possible.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | AssemblyScript → WASM, `@btc-vision/btc-runtime` |
| Backend | Node.js, `@btc-vision/hyper-express`, MongoDB, `opnet` SDK |
| Frontend | React 18, Vite, Tailwind CSS, `@btc-vision/transaction`, `opnet` |
| Wallet | OP_WALLET browser extension (Taproot: `bc1p...` / `bcrt1p...`) |
| Chain | Bitcoin L1 via OPNet (Tapscript calldata) |

---

## Setup

### Prerequisites

- Node.js 20+
- MongoDB running locally (`mongod`)
- OPNet node running (`http://localhost:9001` for regtest)
- OP_WALLET browser extension installed and funded

### 1. Build the Contract

```bash
cd contracts
npm install
npm run build
# Output: contracts/dist/AirdropRegistry.wasm
```

### 2. Deploy the Contract

```bash
# Verify connectivity and get deployment instructions
npx tsx deploy.ts --network regtest

# Then deploy via OP_WALLET:
# 1. Open OP_WALLET → Developer → Deploy Contract
# 2. Upload: contracts/dist/AirdropRegistry.wasm
# 3. Leave calldata empty (no constructor args)
# 4. Confirm transaction → copy the printed contract address
```

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Set AIRDROP_REGISTRY_ADDRESS to the deployed contract address

# Frontend
cp frontend/.env.example frontend/.env
# Set VITE_REGISTRY_ADDRESS to the deployed contract address
```

### 4. Start Backend

```bash
cd backend
npm install
npm run dev
# Listening on http://localhost:3001
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5174
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/airdrops` | Paginated airdrop history |
| GET | `/v1/airdrops/:campaignId` | Campaign detail |
| GET | `/v1/holders/:collection` | Holder addresses for an ordinal collection |
| GET | `/v1/stats` | Platform totals |

### Premade List Collections

`GET /v1/holders/:collection` supports:
`motocats`, `bitcoin-puppets`, `nodemonkes`, `ordinal-maxi-biz`, `quantum-cats`, `bitcoin-frogs`, `taproot-wizards`

Proxies Magic Eden Ordinals API with 10-minute in-memory cache.

---

## Cost Transparency

OPNet gas is paid in Bitcoin satoshis — no separate gas token.

| Recipients | Est. vBytes | Est. Cost (2 sat/vB) | USD (~$100k BTC) |
|------------|-------------|----------------------|------------------|
| 50         | ~1,200       | ~2,400 sats          | ~$2.40           |
| 200        | ~4,500       | ~9,000 sats          | ~$9.00           |
| 1,000      | ~22,500      | ~45,000 sats         | ~$45.00          |
| 10,000     | ~50 batches  | ~450,000 sats total  | ~$450.00         |

**vs Ethereum**: A 1,000-recipient ERC20 airdrop at 30 gwei costs ~$300–$3,000+ depending on congestion. OPNet is consistently 10–100x cheaper.

---

## OPNet Concepts Used

- **Tapscript calldata** — All contract interactions are Bitcoin transactions with WASM calldata in the witness stack
- **OP20** — OPNet's fungible token standard (ERC20 equivalent for Bitcoin)
- **`transferFrom`** — Pull-based token transfer requiring prior approval
- **`Blockchain.call()`** — Cross-contract call within a single Bitcoin transaction
- **`SafeMath`** — Overflow-safe u256 arithmetic (mandatory in OPNet contracts)
- **`StoredU256` / `StoredMapU256`** — OPNet's persistent storage primitives
- **`NetEvent`** — On-chain event emission (indexed by OPNet nodes)
- **Taproot addresses** — `bc1p...` (mainnet) / `bcrt1p...` (regtest) — the external identity for OPNet users

---

## Project Structure

```
opdrop/
├── contracts/
│   ├── src/AirdropRegistry/
│   │   ├── AirdropRegistry.ts   # Core contract — campaign creation, batch transfers
│   │   └── index.ts             # Entry point (Blockchain.contract = () => new AirdropRegistry())
│   ├── abis/                    # Auto-generated ABI JSON + TypeScript bindings
│   ├── asconfig.json
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── server.ts            # Entry point — HyperExpress + MongoDB init
│   │   ├── api/ApiServer.ts     # REST routes
│   │   ├── services/
│   │   │   ├── AirdropService.ts
│   │   │   └── OPNetService.ts  # Provider singleton
│   │   └── db/                  # MongoDB models + repositories
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CreatePage.tsx   # Airdrop wizard (premade lists, batching, cost estimator)
│   │   │   ├── DiscoverPage.tsx # Campaign history
│   │   │   └── ProfilePage.tsx
│   │   ├── data/premadeLists.ts # 7 ordinal community lists
│   │   └── utils/airdropCost.ts # Cost estimation (sats + USD)
│   ├── .env.example
│   └── package.json
└── deploy.ts                    # Deployment guidance script
```

---

## Competition

Built for [vibecode.finance](https://vibecode.finance/) — OPNet Bitcoin hackathon.

**#opnetvibecode**

### What makes this different

- **Real OPNet contract** — AssemblyScript WASM, compiled and verified. Not a mockup.
- **Batch scaling** — The only Bitcoin-native airdrop tool that handles 10,000+ recipients without off-chain trust
- **Community data built-in** — Live ordinal holder lists fetched from Magic Eden, no manual CSV hunting
- **Cost transparency** — Exact sat estimates before every transaction
- **Push model** — Recipients get tokens automatically; nothing to claim, no UX burden on the receiving side
