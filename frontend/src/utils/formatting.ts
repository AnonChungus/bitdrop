const SATS_PER_BTC = 100_000_000n;

export function formatAddress(addr: string, chars = 6): string {
    if (addr.length <= chars * 2 + 2) return addr;
    return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function formatAmount(amount: bigint, decimals = 8): string {
    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const frac = amount % divisor;
    if (frac === 0n) return whole.toLocaleString();
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole.toLocaleString()}.${fracStr}`;
}

export function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)   return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)   return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)   return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export function formatSats(sats: bigint): string {
    if (sats >= SATS_PER_BTC) {
        const btc = Number(sats) / Number(SATS_PER_BTC);
        return `${btc.toFixed(4)} BTC`;
    }
    return `${sats.toLocaleString()} sats`;
}

export function parseCsvLine(line: string): { address: string; amount: bigint } | null {
    const parts = line.trim().split(/[,\t\s]+/);
    if (parts.length < 2) return null;
    const address = (parts[0] ?? '').trim();
    const rawAmount = (parts[1] ?? '').trim();
    if (!address || !rawAmount) return null;
    try {
        return { address, amount: BigInt(rawAmount) };
    } catch {
        return null;
    }
}
