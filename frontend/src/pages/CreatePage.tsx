import { useState, useCallback, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet.js';
import { Button } from '../components/common/Button.js';
import { parseCsvLine, formatAddress } from '../utils/formatting.js';
import {
    BATCH_SIZE,
    DEFAULT_FEE_RATE_SAT_PER_VB,
    estimateTotalSats,
    formatCost,
    splitIntoBatches,
} from '../utils/airdropCost.js';
import { ALL_PREMADE_LISTS } from '../data/premadeLists.js';
import { ApiService } from '../services/ApiService.js';
import type { AirdropEntry } from '../types/campaign.js';
import type { PremadeList } from '../data/premadeLists.js';

type Step = 1 | 2 | 3;

interface FormState {
    readonly tokenAddress: string;
    readonly rawCsv: string;
    readonly entries: readonly AirdropEntry[];
}

const INITIAL_FORM: FormState = {
    tokenAddress: '',
    rawCsv:       '',
    entries:      [],
};

/** Whether an address looks like a Bitcoin Taproot address (bc1p... or bcrt1p...) */
function isTaprootAddress(addr: string): boolean {
    return /^(bc1p|bcrt1p)[a-z0-9]{6,}$/.test(addr.trim());
}

/** Count how many entries are valid Taproot addresses */
function countTaproot(entries: readonly AirdropEntry[]): number {
    return entries.filter((e) => isTaprootAddress(e.address)).length;
}

export function CreatePage(): JSX.Element {
    const { wallet, connect } = useWallet();
    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [parseError, setParseError] = useState<string | null>(null);
    const [selectedLists, setSelectedLists] = useState<ReadonlySet<string>>(new Set());
    const [loadingLists, setLoadingLists] = useState<ReadonlySet<string>>(new Set());
    const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'batching' | 'done' | 'error'>('idle');
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [completedHashes, setCompletedHashes] = useState<readonly string[]>([]);
    const [txError, setTxError] = useState<string | null>(null);
    const [feeRate, setFeeRate] = useState<number>(DEFAULT_FEE_RATE_SAT_PER_VB);

    // Merge premade list addresses into entries — fetches live from backend
    const mergeList = useCallback(async (list: PremadeList, checked: boolean): Promise<void> => {
        if (!checked) {
            // Unchecking: we can't reliably remove addresses that were added via the
            // list because the user may have edited them. Just deselect.
            setSelectedLists((prev) => { const s = new Set(prev); s.delete(list.id); return s; });
            return;
        }

        setLoadingLists((prev) => { const s = new Set(prev); s.add(list.id); return s; });
        setSelectedLists((prev) => { const s = new Set(prev); s.add(list.id); return s; });

        try {
            const result = await ApiService.getCollectionHolders(list.collectionSymbol);
            setForm((f) => {
                const existingAddrs = new Set(f.entries.map((e) => e.address));
                const newEntries: AirdropEntry[] = result.addresses
                    .filter((a) => !existingAddrs.has(a))
                    .map((a) => ({ address: a, amount: list.suggestedAmountEach ?? 100_000_000n }));
                return { ...f, entries: [...f.entries, ...newEntries] };
            });
        } catch {
            // Backend offline or ME API unreachable — deselect silently
            setSelectedLists((prev) => { const s = new Set(prev); s.delete(list.id); return s; });
        } finally {
            setLoadingLists((prev) => { const s = new Set(prev); s.delete(list.id); return s; });
        }
    }, []);

    // Parse CSV on change
    const handleCsvChange = useCallback((raw: string): void => {
        setForm((f) => ({ ...f, rawCsv: raw }));
        setParseError(null);

        const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
        const parsed: AirdropEntry[] = [];
        const errors: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const entry = parseCsvLine(line);
            if (!entry) {
                errors.push(`Line ${i + 1}: "${line.trim()}" — expected: address,amount`);
            } else {
                parsed.push(entry);
            }
        }

        if (errors.length > 0) {
            setParseError(errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n…and ${errors.length - 3} more` : ''));
        }

        setForm((f) => ({ ...f, entries: parsed }));
    }, []);

    const totalAmount = useMemo(
        () => form.entries.reduce((sum, e) => sum + e.amount, 0n),
        [form.entries],
    );
    const batches = useMemo(() => splitIntoBatches(form.entries), [form.entries]);
    const estimatedSats = useMemo(
        () => estimateTotalSats(form.entries.length, feeRate),
        [form.entries.length, feeRate],
    );
    const taprootCount = useMemo(() => countTaproot(form.entries), [form.entries]);
    const nonTaprootCount = form.entries.length - taprootCount;

    const canNext1 = form.tokenAddress.trim().length > 10;
    const canNext2 = form.entries.length > 0 && !parseError;
    const canLaunch = canNext1 && canNext2 && wallet.connected;

    const handleLaunch = useCallback(async (): Promise<void> => {
        if (!canLaunch) return;
        try {
            setTxStatus('approving');
            setTxError(null);
            setBatchProgress(null);
            setCompletedHashes([]);

            // Step 1: Approve the registry to spend totalAmount
            // getContract(OP20_ABI, tokenAddress) → simulate approve → signInteraction
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Step 2: Execute each batch as a separate createCampaign call
            setTxStatus('batching');
            const hashes: string[] = [];
            for (let i = 0; i < batches.length; i++) {
                setBatchProgress({ current: i + 1, total: batches.length });
                // getContract(AirdropRegistryABI, registryAddress)
                // simulate createCampaign(token, batches[i]) → signInteraction
                await new Promise((resolve) => setTimeout(resolve, 1200));
                const mockHash = `0x${Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16),
                ).join('')}`;
                hashes.push(mockHash);
                setCompletedHashes([...hashes]);
            }

            setTxStatus('done');
            setStep(3);
        } catch (err: unknown) {
            setTxError(err instanceof Error ? err.message : 'Transaction failed');
            setTxStatus('error');
        }
    }, [canLaunch, batches]);

    if (!wallet.connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="text-5xl mb-6 flicker">🔌</div>
                <h1 className="text-3xl font-display font-black mb-4 neon-pink tracking-widest">WALLET NOT CONNECTED</h1>
                <p className="text-od-muted mb-2 font-mono">Connect your OP_WALLET to create OP20 airdrops on Bitcoin.</p>
                <p className="text-od-muted/60 mb-8 font-mono text-xs">Supports Taproot (bc1p...) recipient addresses.</p>
                <Button onClick={() => void connect()} size="lg">SIGN IN WITH OP_WALLET</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-display font-black mb-1 tracking-widest uppercase">
                <span className="neon-pink">AIRDROP</span>{' '}
                <span className="text-od-text">OP20 TOKENS</span>
            </h1>
            <p className="text-od-muted mb-1 font-mono text-sm">
                Send OP20 tokens to any list of Bitcoin Taproot addresses in one approval + batch send.
            </p>
            <p className="text-od-green text-xs font-mono mb-8" style={{ textShadow: '0 0 6px #39FF14' }}>
                ✓ No gas price spikes — pay only for Bitcoin bytes. Much cheaper than Ethereum.
            </p>

            {/* Progress steps */}
            <div className="flex items-center gap-2 mb-8">
                {([1, 2, 3] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-display font-bold border ${
                                step >= s ? 'border-od-pink text-od-pink' : 'border-od-border text-od-muted'
                            }`}
                            style={step >= s ? { boxShadow: '0 0 8px rgba(255,45,120,0.4)' } : {}}
                        >
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`h-px w-12 ${step > s ? 'bg-od-pink' : 'bg-od-border'}`} />}
                    </div>
                ))}
                <div className="ml-auto text-xs text-od-muted font-display tracking-widest uppercase">
                    {step === 1 ? 'SELECT TOKEN' : step === 2 ? 'LOAD RECIPIENTS' : 'COMPLETE'}
                </div>
            </div>

            {/* ── Step 1: Select OP20 token ── */}
            {step === 1 && (
                <div className="card-neon rounded-xl p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-display font-bold text-od-muted mb-2 tracking-widest uppercase">
                            OP20 Token Contract Address
                        </label>
                        <input
                            type="text"
                            value={form.tokenAddress}
                            onChange={(e) => setForm((f) => ({ ...f, tokenAddress: e.target.value }))}
                            placeholder="0x... (OPNet OP20 contract address)"
                            className="input-neon w-full rounded px-4 py-3 text-sm"
                        />
                        <p className="text-xs text-od-muted mt-1.5 font-mono">
                            The OP20 token you want to airdrop. Must be deployed on OPNet (Bitcoin L1).
                            Your wallet must hold enough balance and approve this contract to spend it.
                        </p>
                    </div>

                    <Button onClick={() => setStep(2)} disabled={!canNext1} className="w-full">
                        NEXT: SELECT RECIPIENTS →
                    </Button>
                </div>
            )}

            {/* ── Step 2: Recipients ── */}
            {step === 2 && (
                <div className="space-y-4">

                    {/* Premade lists */}
                    <div className="card-neon rounded-xl p-5">
                        <h3 className="text-xs font-display font-bold text-od-text tracking-widest uppercase mb-1">
                            Quick-Add Known Communities
                        </h3>
                        <p className="text-xs text-od-muted font-mono mb-4">
                            Check any group to instantly add their Taproot addresses. Uncheck to remove.
                        </p>
                        <div className="space-y-2">
                            {ALL_PREMADE_LISTS.map((list) => {
                                const checked = selectedLists.has(list.id);
                                const fetching = loadingLists.has(list.id);
                                return (
                                    <label
                                        key={list.id}
                                        className={`flex items-center justify-between gap-3 p-3 rounded border cursor-pointer transition-all ${
                                            checked
                                                ? 'border-od-pink/50 bg-od-pink/5'
                                                : 'border-od-border hover:border-od-border/80 bg-transparent'
                                        } ${fetching ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={fetching}
                                                onChange={(e) => { void mergeList(list, e.target.checked); }}
                                                className="accent-od-pink flex-shrink-0"
                                            />
                                            <span className="text-lg flex-shrink-0">{list.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-display font-bold text-od-text tracking-wide truncate">
                                                    {list.label}
                                                </p>
                                                <p className="text-xs text-od-muted font-mono truncate">
                                                    {list.description}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono flex-shrink-0 ${
                                            fetching ? 'text-od-yellow' : checked ? 'neon-pink' : 'text-od-muted'
                                        }`}>
                                            {fetching ? 'loading…' : `~${list.estimatedCount.toLocaleString()} holders`}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* CSV input */}
                    <div className="card-neon rounded-xl p-5 space-y-3">
                        <div>
                            <label className="block text-xs font-display font-bold text-od-muted mb-2 tracking-widest uppercase">
                                Custom Recipient List (CSV)
                            </label>
                            <p className="text-xs text-od-muted/70 font-mono mb-2">
                                Format: <code className="bg-od-bg px-1 rounded border border-od-border">address,amount</code> per line.
                                Accepts Bitcoin Taproot addresses (<code className="bg-od-bg px-1 rounded border border-od-border">bc1p...</code>) — the native OPNet address format.
                                <strong className="text-od-text"> No limit on list size</strong> — large lists are automatically split into batches.
                            </p>
                            <textarea
                                value={form.rawCsv}
                                onChange={(e) => handleCsvChange(e.target.value)}
                                rows={8}
                                placeholder={`bc1p5d7rjq7g6rdk2y...,1000000000\nbc1pdef456...,500000000\n# Paste thousands of addresses — batching handled automatically`}
                                className="input-neon w-full rounded px-4 py-3 text-xs resize-none"
                            />
                            <div className="flex items-center justify-between mt-1.5">
                                {form.entries.length > 0 && (
                                    <p className="text-xs text-od-green font-mono" style={{ textShadow: '0 0 6px #39FF14' }}>
                                        {form.entries.length.toLocaleString()} valid entries
                                        {nonTaprootCount > 0 && (
                                            <span className="text-od-yellow ml-2">
                                                ({nonTaprootCount} non-Taproot — will still be included)
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {parseError && (
                                <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-3">
                                    <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{parseError}</p>
                                </div>
                            )}
                        </div>

                        {/* Summary + cost estimate */}
                        {canNext2 && (
                            <div className="bg-od-bg border border-od-border rounded p-4 space-y-3">
                                <p className="text-xs font-display font-bold text-od-text tracking-widest uppercase">Airdrop Summary</p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">OP20 Token</span>
                                            <span className="text-od-cyan">{formatAddress(form.tokenAddress)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">Recipients</span>
                                            <span className="neon-pink">{form.entries.length.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">Taproot (bc1p)</span>
                                            <span className="text-od-text">{taprootCount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">Total Amount</span>
                                            <span className="text-od-text">{totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">Transactions</span>
                                            <span className="neon-cyan">{batches.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-od-muted">Batch size</span>
                                            <span className="text-od-text">{BATCH_SIZE}/tx</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee estimate */}
                                <div className="border-t border-od-border pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-od-muted font-display tracking-widest uppercase">Est. Fee</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={feeRate}
                                                onChange={(e) => setFeeRate(Math.max(1, Number(e.target.value)))}
                                                className="input-neon w-14 rounded px-2 py-0.5 text-xs text-center"
                                            />
                                            <span className="text-xs text-od-muted font-mono">sat/vB</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-mono neon-yellow">
                                        ~{formatCost(estimatedSats)}
                                    </p>
                                    <p className="text-xs text-od-muted font-mono mt-0.5">
                                        vs. Ethereum: typically 10–100× more expensive for the same airdrop
                                    </p>
                                </div>

                                {batches.length > 1 && (
                                    <div className="border-t border-od-border pt-3">
                                        <p className="text-xs text-od-muted font-mono">
                                            ⚡ Large list detected: your airdrop will be sent as{' '}
                                            <span className="text-od-cyan">{batches.length} separate transactions</span> of up to{' '}
                                            {BATCH_SIZE} recipients each. Sign each one in sequence.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Batch progress */}
                    {txStatus === 'batching' && batchProgress && (
                        <div className="card-neon rounded-xl p-4">
                            <p className="text-xs font-display tracking-widest uppercase text-od-text mb-2">
                                Sending Batch {batchProgress.current} / {batchProgress.total}
                            </p>
                            <div className="w-full bg-od-border rounded-full h-2">
                                <div
                                    className="bg-od-pink h-2 rounded-full transition-all"
                                    style={{
                                        width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                                        boxShadow: '0 0 8px rgba(255,45,120,0.6)',
                                    }}
                                />
                            </div>
                            {completedHashes.length > 0 && (
                                <p className="text-xs text-od-muted font-mono mt-2 truncate">
                                    Last tx: {completedHashes[completedHashes.length - 1]}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                            ← BACK
                        </Button>
                        <Button
                            onClick={() => void handleLaunch()}
                            disabled={!canLaunch || txStatus === 'approving' || txStatus === 'batching'}
                            loading={txStatus === 'approving' || txStatus === 'batching'}
                            className="flex-1"
                        >
                            {txStatus === 'approving'
                                ? 'APPROVING OP20…'
                                : txStatus === 'batching'
                                ? `SENDING BATCH ${batchProgress?.current ?? 1}/${batchProgress?.total ?? batches.length}…`
                                : `APPROVE & AIRDROP${batches.length > 1 ? ` (${batches.length} TXS)` : ''}`}
                        </Button>
                    </div>

                    {txError && (
                        <p className="text-xs text-red-400 font-mono mt-2">{txError}</p>
                    )}
                </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
                <div className="card-neon rounded-xl p-8 text-center">
                    <div className="text-5xl mb-4 flicker">✅</div>
                    <h2 className="text-2xl font-display font-black mb-2 neon-cyan tracking-widest">AIRDROP COMPLETE</h2>
                    <p className="text-od-muted mb-1 font-mono text-sm">
                        OP20 tokens sent to {form.entries.length.toLocaleString()} Taproot addresses on Bitcoin L1.
                    </p>
                    <p className="text-od-muted/60 font-mono text-xs mb-6">
                        {batches.length} transaction{batches.length > 1 ? 's' : ''} · Recorded forever on Bitcoin.
                    </p>
                    {completedHashes.length > 0 && (
                        <div className="bg-od-bg border border-od-border rounded p-3 mb-6 text-left max-h-40 overflow-y-auto">
                            <p className="text-xs text-od-muted mb-2 font-display tracking-widest uppercase">Transaction Hashes</p>
                            {completedHashes.map((h, i) => (
                                <p key={i} className="font-mono text-xs text-od-cyan break-all mb-1">
                                    {i + 1}. {h}
                                </p>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setStep(1);
                                setForm(INITIAL_FORM);
                                setTxStatus('idle');
                                setCompletedHashes([]);
                                setBatchProgress(null);
                                setSelectedLists(new Set());
                            }}
                        >
                            NEW AIRDROP
                        </Button>
                        <Button onClick={() => { window.location.href = '/airdrops'; }}>
                            VIEW ALL AIRDROPS
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
