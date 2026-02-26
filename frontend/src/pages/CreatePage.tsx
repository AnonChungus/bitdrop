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
                <div className="text-5xl mb-6">🔐</div>
                <h1 className="text-3xl font-bold text-bd-text mb-4">Connect your wallet</h1>
                <p className="text-bd-muted mb-8">You need OP_WALLET to create airdrops on Bitcoin.</p>
                <Button onClick={() => void connect()} size="lg">Connect Wallet</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-bd-text mb-2">Create Airdrop</h1>
            <p className="text-bd-muted mb-8">Drop tokens to any list of Bitcoin addresses in one transaction.</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
                {([1, 2, 3] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            step >= s ? 'bg-bd-purple text-white' : 'bg-bd-border text-bd-muted'
                        }`}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`flex-1 h-0.5 w-12 ${step > s ? 'bg-bd-purple' : 'bg-bd-border'}`} />}
                    </div>
                ))}
                <div className="ml-auto text-sm text-bd-muted">
                    {step === 1 ? 'Token' : step === 2 ? 'Recipients' : 'Done'}
                </div>
            </div>

            {/* Step 1: Token */}
            {step === 1 && (
                <div className="bg-bd-card border border-bd-border rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-bd-text mb-2">
                            Token Contract Address
                        </label>
                        <input
                            type="text"
                            value={form.tokenAddress}
                            onChange={(e) => setForm((f) => ({ ...f, tokenAddress: e.target.value }))}
                            placeholder="0x..."
                            className="w-full bg-bd-bg border border-bd-border rounded-lg px-4 py-3 text-bd-text font-mono text-sm focus:border-bd-purple focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-bd-muted mt-1.5">
                            The OP20 token you want to airdrop. Paste the contract address.
                        </p>
                    </div>

                    <Button onClick={() => setStep(2)} disabled={!canNext1} className="w-full">
                        Next: Add Recipients →
                    </Button>
                </div>
            )}

            {/* Step 2: Recipients */}
            {step === 2 && (
                <div className="bg-bd-card border border-bd-border rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-bd-text mb-2">
                            Recipient List (CSV)
                        </label>
                        <textarea
                            value={form.rawCsv}
                            onChange={(e) => handleCsvChange(e.target.value)}
                            rows={10}
                            placeholder={`address,amount\n0xabc123...,1000000000\n0xdef456...,500000000`}
                            className="w-full bg-bd-bg border border-bd-border rounded-lg px-4 py-3 text-bd-text font-mono text-xs focus:border-bd-purple focus:outline-none transition-colors resize-none"
                        />
                        <div className="flex items-center justify-between mt-1.5">
                            <p className="text-xs text-bd-muted">
                                Format: <code className="bg-bd-bg px-1 rounded">address,amount</code> — one per line. Max 50 recipients.
                            </p>
                            {form.entries.length > 0 && (
                                <p className="text-xs text-bd-success">
                                    {form.entries.length} valid
                                </p>
                            )}
                        </div>

                        {parseError && (
                            <div className="mt-2 bg-bd-danger/10 border border-bd-danger/30 rounded-lg p-3">
                                <p className="text-xs text-bd-danger font-mono whitespace-pre-wrap">{parseError}</p>
                            </div>
                        )}

                        {form.entries.length > 50 && (
                            <div className="mt-2 bg-bd-danger/10 border border-bd-danger/30 rounded-lg p-3">
                                <p className="text-xs text-bd-danger">Maximum 50 recipients per campaign. You have {form.entries.length}.</p>
                            </div>
                        )}

                        {canNext2 && (
                            <div className="mt-3 bg-bd-purple/10 border border-bd-purple/30 rounded-lg p-3">
                                <p className="text-sm font-semibold text-bd-text mb-1">Campaign Summary</p>
                                <div className="space-y-1 text-xs text-bd-muted">
                                    <div className="flex justify-between">
                                        <span>Token</span>
                                        <span className="font-mono text-bd-text">{formatAddress(form.tokenAddress)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Recipients</span>
                                        <span className="text-bd-purple-lt">{form.entries.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Amount</span>
                                        <span className="font-mono text-bd-text">{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                            ← Back
                        </Button>
                        <Button
                            onClick={() => void handleLaunch()}
                            disabled={!canLaunch}
                            loading={txStatus === 'approving' || txStatus === 'launching'}
                            className="flex-1"
                        >
                            {txStatus === 'approving'
                                ? 'Approving tokens…'
                                : txStatus === 'launching'
                                ? 'Launching…'
                                : 'Approve & Launch 🚀'}
                        </Button>
                    </div>

                    {txError && (
                        <p className="text-xs text-bd-danger mt-2">{txError}</p>
                    )}
                </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
                <div className="bg-bd-card border border-bd-border rounded-xl p-8 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-bd-text mb-2">Airdrop Launched!</h2>
                    <p className="text-bd-muted mb-6">
                        Tokens have been distributed to {form.entries.length} recipients on Bitcoin L1.
                    </p>
                    {txHash && (
                        <div className="bg-bd-bg rounded-lg p-3 mb-6">
                            <p className="text-xs text-bd-muted mb-1">Transaction Hash</p>
                            <p className="font-mono text-xs text-bd-purple-lt break-all">{txHash}</p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="secondary"
                            onClick={() => { setStep(1); setForm(INITIAL_FORM); setTxStatus('idle'); setTxHash(null); }}
                        >
                            Create Another
                        </Button>
                        <Button onClick={() => window.location.href = '/discover'}>
                            View All Campaigns
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
