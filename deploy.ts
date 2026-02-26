/**
 * OpDrop — AirdropRegistry Deployment Script
 *
 * Usage:
 *   npx tsx deploy.ts [--network regtest|mainnet] [--rpc <url>]
 *
 * Prerequisites:
 *   - OP_WALLET installed and funded (regtest: use faucet at http://localhost:3000)
 *   - OPNet node running (regtest: http://localhost:9001)
 *   - Set DEPLOYER_WIF env var (WIF-encoded private key) or uses OP_WALLET
 *
 * After deployment:
 *   1. Copy the printed contract address
 *   2. Set AIRDROP_REGISTRY_ADDRESS in backend/.env
 *   3. Set VITE_REGISTRY_ADDRESS in frontend/.env
 */

import { JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const networkArg = args.find((_, i) => args[i - 1] === '--network') ?? 'regtest';
const rpcArg = args.find((_, i) => args[i - 1] === '--rpc') ??
    (networkArg === 'mainnet' ? 'https://mainnet.opnet.org' : 'http://localhost:9001');

const btcNetwork = networkArg === 'mainnet' ? networks.bitcoin : networks.regtest;

async function deploy(): Promise<void> {
    console.log(`\n📡 OpDrop — AirdropRegistry Deployment`);
    console.log(`   Network : ${networkArg}`);
    console.log(`   RPC     : ${rpcArg}`);
    console.log();

    const provider = new JSONRpcProvider(rpcArg, btcNetwork);

    // Verify RPC connectivity
    let blockNum: bigint;
    try {
        blockNum = await provider.getBlockNumber();
        console.log(`✓ Connected to OPNet node — block ${blockNum}`);
    } catch (err) {
        console.error(`✗ Cannot reach OPNet RPC at ${rpcArg}`);
        console.error(`  Is your OPNet node running?`);
        console.error(`  Regtest: start with "opnet-node --regtest"`);
        process.exit(1);
    }

    // Load WASM bytecode
    const wasmPath = path.join(import.meta.dirname, 'contracts', 'dist', 'AirdropRegistry.wasm');
    if (!fs.existsSync(wasmPath)) {
        console.error(`✗ WASM not found at ${wasmPath}`);
        console.error(`  Run: cd contracts && npm run build`);
        process.exit(1);
    }
    const wasm = fs.readFileSync(wasmPath);
    console.log(`✓ Loaded AirdropRegistry.wasm (${wasm.byteLength.toLocaleString()} bytes)`);

    console.log();
    console.log('To deploy via OP_WALLET (recommended):');
    console.log('  1. Open OP_WALLET browser extension');
    console.log('  2. Navigate to Developer → Deploy Contract');
    console.log(`  3. Upload: contracts/dist/AirdropRegistry.wasm`);
    console.log('  4. Leave calldata empty (no constructor args)');
    console.log('  5. Confirm transaction');
    console.log();
    console.log('Or use the @btc-vision/transaction SDK:');
    console.log('  import { DeploymentTransaction } from "@btc-vision/transaction";');
    console.log('  const tx = new DeploymentTransaction(network, wasm, signer);');
    console.log('  const receipt = await tx.signInteraction(provider, ...);');
    console.log();
    console.log('After deployment, set these env vars:');
    console.log('  AIRDROP_REGISTRY_ADDRESS=0x<your-contract-address>   # backend/.env');
    console.log('  VITE_REGISTRY_ADDRESS=0x<your-contract-address>       # frontend/.env');

    provider.destroy();
}

deploy().catch(console.error);
