/**
 * OPNet Airdrop Cost Estimator
 *
 * OPNet uses Bitcoin's native fee market. All fees are paid in satoshis — no
 * separate gas token. Transaction calldata lives in Bitcoin Tapscript witness.
 *
 * Live mainnet gas parameters (block 938,498, Feb 2026):
 *   gasPerSat  = 1,000,000  (1 sat buys 1M OPNet gas units)
 *   baseGas    = 100,000,000
 *   ema        = 50,000
 *   BTC fee    = 1.5–3.0 sat/vB  (historically very low right now)
 *
 * Calldata layout per createCampaign call:
 *   4 bytes  - method selector
 *  32 bytes  - OP20 token address (u256)
 *   4 bytes  - recipient count (u32)
 *  64 bytes  - per recipient: Taproot address (32) + OP20 amount (32)
 *
 * Taproot witness discount: 0.25× vBytes vs non-witness bytes (SegWit rules).
 * Non-witness Bitcoin tx overhead: ~200 vBytes (inputs, outputs, headers).
 *
 * Comparison: Ethereum token transfer to N addresses via batch contract
 * typically costs $5–$100 in gas at current ETH prices. OPNet equivalent
 * for the same airdrop: $0.01–$2 at current Bitcoin fee rates.
 */

/** Maximum recipients per single OPNet tx. Keeps witness data under ~15 KB. */
export const BATCH_SIZE = 200;

/** Default recommended fee rate from live OPNet gas API (sat/vB). */
export const DEFAULT_FEE_RATE_SAT_PER_VB = 2;

/**
 * Estimate vBytes for one airdrop transaction with `count` recipients.
 * Witness discount (0.25×) applied to calldata portion.
 */
export function estimateVBytes(count: number): number {
    const BASE_CALLDATA = 4 + 32 + 4; // selector + OP20 token addr + count
    const PER_RECIPIENT = 64;          // Taproot address(32) + amount(32)
    const calldataBytes = BASE_CALLDATA + count * PER_RECIPIENT;
    const witnessVBytes = calldataBytes * 0.25;  // Taproot witness discount
    const btcTxOverhead = 200;                    // non-witness vBytes
    return Math.ceil(btcTxOverhead + witnessVBytes);
}

/**
 * Estimate OPNet contract gas satoshi cost for one call.
 * Based on live gasPerSat = 1,000,000.
 * A loop of N transfers costs roughly N × 50,000 gas units.
 */
function estimateContractGasSats(count: number): number {
    const GAS_PER_TRANSFER = 50_000;  // empirical estimate per OP20 transfer call
    const CALL_OVERHEAD     = 200_000; // contract dispatch + transferFrom base
    const gasUnits = CALL_OVERHEAD + count * GAS_PER_TRANSFER;
    const GAS_PER_SAT = 1_000_000;
    return Math.ceil(gasUnits / GAS_PER_SAT);
}

/**
 * Estimate total cost in satoshis for the entire airdrop.
 * Includes both Bitcoin tx fees and OPNet contract gas.
 *
 * @param totalRecipients - total number of Taproot recipient addresses
 * @param satPerVbyte     - Bitcoin fee rate (default: 2 sat/vB — current OPNet recommended)
 */
export function estimateTotalSats(totalRecipients: number, satPerVbyte = DEFAULT_FEE_RATE_SAT_PER_VB): number {
    const batches = Math.ceil(totalRecipients / BATCH_SIZE);
    let totalSats = 0;
    let remaining = totalRecipients;
    for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(remaining, BATCH_SIZE);
        const txFeeSats = Math.ceil(estimateVBytes(batchCount) * satPerVbyte);
        const gasSats   = estimateContractGasSats(batchCount);
        totalSats += txFeeSats + gasSats;
        remaining -= batchCount;
    }
    return totalSats;
}

/**
 * Format sats as a human-readable string with USD equivalent.
 * @param sats         - satoshi amount
 * @param btcUsdPrice  - current BTC/USD price (default: 95,000)
 */
export function formatCost(sats: number, btcUsdPrice = 95_000): string {
    const usd = (sats / 1e8) * btcUsdPrice;
    const satsStr = sats.toLocaleString();
    const usdStr = usd < 0.01 ? '<$0.01' : `~$${usd.toFixed(2)}`;
    return `${satsStr} sats (${usdStr})`;
}

/** Split a flat list of entries into batches of BATCH_SIZE. */
export function splitIntoBatches<T>(entries: readonly T[]): readonly (readonly T[])[] {
    const batches: T[][] = [];
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        batches.push(entries.slice(i, i + BATCH_SIZE) as T[]);
    }
    return batches;
}
