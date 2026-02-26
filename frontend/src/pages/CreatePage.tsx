import { useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet.js';
import { Button } from '../components/common/Button.js';
import { parseCsvLine, formatAmount, formatAddress } from '../utils/formatting.js';
import type { AirdropEntry } from '../types/campaign.js';

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

export function CreatePage(): JSX.Element {
    const { wallet, connect } = useWallet();
    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [parseError, setParseError] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'launching' | 'done' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

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

    const totalAmount = form.entries.reduce((sum, e) => sum + e.amount, 0n);
    const canNext1 = form.tokenAddress.trim().length > 10;
    const canNext2 = form.entries.length > 0 && form.entries.length <= 50 && !parseError;
    const canLaunch = canNext1 && canNext2 && wallet.connected;

    const handleLaunch = useCallback(async (): Promise<void> => {
        if (!canLaunch) return;

        try {
            setTxStatus('approving');
            setTxError(null);

            // In a real implementation this would:
            // 1. Get contract instance via getContract(OP20_ABI, tokenAddress)
            // 2. Simulate approve(registryAddress, totalAmount)
            // 3. sendTransaction
            // 4. Then getContract(AirdropRegistryABI, registryAddress)
            // 5. Simulate createCampaign(token, entries)
            // 6. sendTransaction
            // For the demo, we show the flow:

            await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate approve
            setTxStatus('launching');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate launch

            // Mock tx hash for demo
            setTxHash(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
            setTxStatus('done');
            setStep(3);
        } catch (err: unknown) {
            setTxError(err instanceof Error ? err.message : 'Transaction failed');
            setTxStatus('error');
        }
    }, [canLaunch]);

    if (!wallet.connected) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="text-5xl mb-6 flicker">🔌</div>
                <h1 className="text-3xl font-display font-black mb-4 neon-pink tracking-widest">NOT JACKED IN</h1>
                <p className="text-od-muted mb-8 font-mono">You need OP_WALLET to broadcast on Bitcoin.</p>
                <Button onClick={() => void connect()} size="lg">JACK IN</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-display font-black mb-1 tracking-widest uppercase">
                <span className="neon-pink">BROADCAST</span> SIGNAL
            </h1>
            <p className="text-od-muted mb-8 font-mono text-sm">Drop tokens to any list of addresses in one transaction.</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
                {([1, 2, 3] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-display font-bold border ${
                            step >= s
                                ? 'border-od-pink text-od-pink'
                                : 'border-od-border text-od-muted'
                        }`}
                            style={step >= s ? { boxShadow: '0 0 8px rgba(255,45,120,0.4)' } : {}}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`flex-1 h-px w-12 ${step > s ? 'bg-od-pink' : 'bg-od-border'}`} />}
                    </div>
                ))}
                <div className="ml-auto text-xs text-od-muted font-display tracking-widest uppercase">
                    {step === 1 ? 'TARGET TOKEN' : step === 2 ? 'LOAD CREW' : 'TRANSMITTED'}
                </div>
            </div>

            {/* Step 1: Token */}
            {step === 1 && (
                <div className="card-neon rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-display font-bold text-od-muted mb-2 tracking-widest uppercase">
                            Token Contract Address
                        </label>
                        <input
                            type="text"
                            value={form.tokenAddress}
                            onChange={(e) => setForm((f) => ({ ...f, tokenAddress: e.target.value }))}
                            placeholder="0x..."
                            className="input-neon w-full rounded px-4 py-3 text-sm"
                        />
                        <p className="text-xs text-od-muted mt-1.5 font-mono">
                            The OP20 token you want to broadcast. Paste the contract address.
                        </p>
                    </div>

                    <Button onClick={() => setStep(2)} disabled={!canNext1} className="w-full">
                        NEXT: LOAD CREW →
                    </Button>
                </div>
            )}

            {/* Step 2: Recipients */}
            {step === 2 && (
                <div className="card-neon rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-display font-bold text-od-muted mb-2 tracking-widest uppercase">
                            Target List (CSV)
                        </label>
                        <textarea
                            value={form.rawCsv}
                            onChange={(e) => handleCsvChange(e.target.value)}
                            rows={10}
                            placeholder={`address,amount\n0xabc123...,1000000000\n0xdef456...,500000000`}
                            className="input-neon w-full rounded px-4 py-3 text-xs resize-none"
                        />
                        <div className="flex items-center justify-between mt-1.5">
                            <p className="text-xs text-od-muted font-mono">
                                Format: <code className="bg-od-bg px-1 rounded border border-od-border">address,amount</code> — one per line. Max 50 targets.
                            </p>
                            {form.entries.length > 0 && (
                                <p className="text-xs text-od-green font-mono" style={{ textShadow: '0 0 6px #39FF14' }}>
                                    {form.entries.length} locked
                                </p>
                            )}
                        </div>

                        {parseError && (
                            <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-3">
                                <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{parseError}</p>
                            </div>
                        )}

                        {form.entries.length > 50 && (
                            <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-3">
                                <p className="text-xs text-red-400 font-mono">Max 50 targets per broadcast. You have {form.entries.length}.</p>
                            </div>
                        )}

                        {canNext2 && (
                            <div className="mt-3 bg-od-pink/5 border border-od-pink/20 rounded p-3">
                                <p className="text-xs font-display font-bold text-od-text mb-2 tracking-widest uppercase">Transmission Summary</p>
                                <div className="space-y-1.5 text-xs text-od-muted font-mono">
                                    <div className="flex justify-between">
                                        <span>Token</span>
                                        <span className="text-od-cyan">{formatAddress(form.tokenAddress)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Crew Size</span>
                                        <span className="neon-pink">{form.entries.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Signal</span>
                                        <span className="text-od-text">{formatAmount(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                            ← BACK
                        </Button>
                        <Button
                            onClick={() => void handleLaunch()}
                            disabled={!canLaunch}
                            loading={txStatus === 'approving' || txStatus === 'launching'}
                            className="flex-1"
                        >
                            {txStatus === 'approving'
                                ? 'AUTHORIZING…'
                                : txStatus === 'launching'
                                ? 'BROADCASTING…'
                                : 'BROADCAST 📡'}
                        </Button>
                    </div>

                    {txError && (
                        <p className="text-xs text-red-400 font-mono mt-2">{txError}</p>
                    )}
                </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
                <div className="card-neon rounded-xl p-8 text-center">
                    <div className="text-5xl mb-4 flicker">📡</div>
                    <h2 className="text-2xl font-display font-black mb-2 neon-cyan tracking-widest">SIGNAL SENT</h2>
                    <p className="text-od-muted mb-6 font-mono text-sm">
                        Tokens broadcast to {form.entries.length} addresses on Bitcoin L1. Recorded forever.
                    </p>
                    {txHash && (
                        <div className="bg-od-bg border border-od-border rounded p-3 mb-6">
                            <p className="text-xs text-od-muted mb-1 font-display tracking-widest uppercase">Tx Hash</p>
                            <p className="font-mono text-xs text-od-cyan break-all">{txHash}</p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="secondary"
                            onClick={() => { setStep(1); setForm(INITIAL_FORM); setTxStatus('idle'); setTxHash(null); }}
                        >
                            BROADCAST AGAIN
                        </Button>
                        <Button onClick={() => { window.location.href = '/discover'; }}>
                            SCAN THE GRID
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
