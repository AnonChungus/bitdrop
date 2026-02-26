import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CampaignGrid } from '../components/campaign/CampaignGrid.js';
import { useCampaigns } from '../hooks/useCampaigns.js';
import { ApiService } from '../services/ApiService.js';
import { BATCH_SIZE, formatCost } from '../utils/airdropCost.js';

export function HomePage(): JSX.Element {
    const { items, loading, error } = useCampaigns({ limit: 8 });
    const [stats, setStats] = useState<{ totalCampaigns: number; totalRecipients: number } | null>(null);

    useEffect(() => {
        ApiService.getStats()
            .then(setStats)
            .catch(() => null);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Hero */}
            <section className="py-20 text-center relative">
                {/* Ambient glow */}
                <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
                    <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[700px] h-[400px] rounded-full bg-od-pink/5 blur-3xl" />
                    <div className="absolute left-1/3 top-20 w-[400px] h-[300px] rounded-full bg-od-purple/5 blur-3xl" />
                </div>
                <div className="horizon-glow absolute inset-x-0 bottom-0 h-40 pointer-events-none" />

                <div className="relative">
                    {/* Live badge */}
                    <div className="inline-flex items-center gap-2 border border-od-pink/30 bg-od-pink/5 rounded-full px-4 py-1.5 text-xs font-display tracking-widest uppercase text-od-pink mb-8">
                        <span className="w-2 h-2 bg-od-green rounded-full animate-pulse" style={{ boxShadow: '0 0 6px #39FF14' }} />
                        Live on Bitcoin L1 via OPNet
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-7xl font-display font-black mb-4 leading-none tracking-widest">
                        <span className="neon-pink block">AIRDROP</span>
                        <span className="neon-cyan block">OP20 TOKENS</span>
                    </h1>
                    <p className="text-od-text text-xl sm:text-2xl font-mono mb-4">
                        to Bitcoin Taproot addresses — in one transaction
                    </p>

                    <p className="text-od-muted text-base max-w-xl mx-auto mb-3 font-mono">
                        Upload a list of <strong className="text-od-text">bc1p...</strong> Taproot addresses and amounts.
                        Approve your OP20 token. The registry distributes to every recipient on-chain, instantly.
                    </p>

                    {/* Cost hook */}
                    <p className="text-od-green text-sm font-mono mb-10" style={{ textShadow: '0 0 6px #39FF14' }}>
                        ✓ {formatCost(250)} for 100 recipients at 5 sat/vB — no gas price spikes
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/create"
                            className="btn-neon-pink font-display text-sm font-bold px-8 py-4 rounded tracking-widest uppercase"
                        >
                            START AIRDROP
                        </Link>
                        <Link
                            to="/airdrops"
                            className="border border-od-border hover:border-od-cyan/50 text-od-muted hover:text-od-cyan font-display text-sm font-bold px-8 py-4 rounded tracking-widest uppercase transition-all"
                        >
                            VIEW ALL AIRDROPS
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            {stats && (
                <section className="py-8">
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {[
                            { label: 'AIRDROPS SENT', value: stats.totalCampaigns.toLocaleString(), color: 'neon-pink' },
                            { label: 'ADDRESSES REACHED', value: stats.totalRecipients.toLocaleString(), color: 'neon-cyan' },
                        ].map((stat) => (
                            <div key={stat.label} className="card-neon rounded-xl p-4 text-center">
                                <p className={`text-2xl font-display font-black ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-od-muted font-display tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* How it works */}
            <section className="py-12">
                <h2 className="text-xl font-display font-bold text-center mb-2 tracking-widest uppercase">
                    <span className="neon-pink">HOW</span>{' '}
                    <span className="neon-cyan">IT WORKS</span>
                </h2>
                <p className="text-center text-od-muted font-mono text-sm mb-10">
                    Three steps. Unlimited recipients. No gas price surprises.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        {
                            step: '01',
                            icon: '📋',
                            title: 'Upload Recipient List',
                            desc: `Paste a CSV of Bitcoin Taproot (bc1p...) addresses and OP20 token amounts. No address limit — lists of 10,000+ are auto-batched into ${BATCH_SIZE}/tx.`,
                        },
                        {
                            step: '02',
                            icon: '🔑',
                            title: 'Approve OP20 Spend',
                            desc: 'Sign one approval transaction with OP_WALLET, authorising the AirdropRegistry to spend the total amount from your OP20 balance.',
                        },
                        {
                            step: '03',
                            icon: '✅',
                            title: 'Tokens Distributed',
                            desc: 'The contract transfers OP20 tokens directly to each Taproot address in the same transaction. No claiming — recipients receive instantly.',
                        },
                    ].map((item) => (
                        <div key={item.step} className="card-neon rounded-xl p-6 text-center">
                            <div className="text-od-pink font-display font-black text-xs tracking-widest mb-3 opacity-60">
                                {item.step}
                            </div>
                            <div className="text-3xl mb-3">{item.icon}</div>
                            <h3 className="font-display font-bold text-od-text mb-2 tracking-widest text-sm uppercase">{item.title}</h3>
                            <p className="text-od-muted text-sm font-mono">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why OPNet */}
            <section className="py-8">
                <div className="card-neon rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    {[
                        { icon: '💰', title: 'Cheap', desc: '~$0.25–$2 for 100 recipients at typical Bitcoin fee rates. No Ethereum gas spikes.' },
                        { icon: '🔒', title: 'Trustless', desc: 'On-chain smart contract. No custodians. Airdrop logic is verifiable on Bitcoin L1.' },
                        { icon: '⚡', title: 'Instant', desc: 'Recipients receive tokens the moment your transaction confirms — no claim step.' },
                    ].map((item) => (
                        <div key={item.title}>
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <h3 className="font-display font-bold text-od-text text-sm tracking-widest uppercase mb-1">{item.title}</h3>
                            <p className="text-od-muted text-xs font-mono">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent airdrops */}
            <section className="py-8 pb-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-display font-bold tracking-widest uppercase">
                        <span className="neon-cyan">RECENT</span> AIRDROPS
                    </h2>
                    <Link to="/airdrops" className="text-od-pink hover:text-od-pink-lt transition-colors text-xs font-display tracking-widest uppercase">
                        View All →
                    </Link>
                </div>
                <CampaignGrid items={items} loading={loading} error={error} />
            </section>
        </div>
    );
}
