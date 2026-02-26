import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CampaignGrid } from '../components/campaign/CampaignGrid.js';
import { useCampaigns } from '../hooks/useCampaigns.js';
import { ApiService } from '../services/ApiService.js';

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
                {/* Horizon glow */}
                <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
                    <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[700px] h-[400px] rounded-full bg-od-pink/5 blur-3xl" />
                    <div className="absolute left-1/3 top-20 w-[400px] h-[300px] rounded-full bg-od-purple/5 blur-3xl" />
                </div>
                <div className="horizon-glow absolute inset-x-0 bottom-0 h-40 pointer-events-none" />

                <div className="relative">
                    {/* Live badge */}
                    <div className="inline-flex items-center gap-2 border border-od-pink/30 bg-od-pink/5 rounded-full px-4 py-1.5 text-xs font-display tracking-widest uppercase text-od-pink-lt mb-8">
                        <span className="w-2 h-2 bg-od-green rounded-full animate-pulse" style={{ boxShadow: '0 0 6px #39FF14' }} />
                        Live on Bitcoin L1 via OPNet
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-7xl font-display font-black mb-6 leading-none tracking-widest">
                        <span className="neon-pink block">BROADCAST</span>
                        <span className="neon-cyan block">TOKENS</span>
                        <span className="text-od-text block text-3xl sm:text-4xl mt-2 font-mono font-normal tracking-wide">
                            to any crew on Bitcoin L1
                        </span>
                    </h1>

                    <p className="text-od-muted text-lg max-w-xl mx-auto mb-10 font-mono">
                        Upload the list. Flip the switch. Tokens hit every wallet in one transaction —
                        no trust, no custodians, carved into Bitcoin forever.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/create"
                            className="btn-neon-pink font-display text-sm font-bold px-8 py-4 rounded tracking-widest uppercase"
                        >
                            BROADCAST NOW
                        </Link>
                        <Link
                            to="/discover"
                            className="border border-od-border hover:border-od-cyan/50 text-od-muted hover:text-od-cyan font-display text-sm font-bold px-8 py-4 rounded tracking-widest uppercase transition-all"
                        >
                            SCAN THE GRID
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            {stats && (
                <section className="py-8">
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {[
                            { label: 'TRANSMISSIONS', value: stats.totalCampaigns.toLocaleString(), color: 'neon-pink' },
                            { label: 'RECEIVERS', value: stats.totalRecipients.toLocaleString(), color: 'neon-cyan' },
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
                    <span className="neon-pink">HOW IT</span>{' '}
                    <span className="neon-cyan">WORKS</span>
                </h2>
                <p className="text-center text-od-muted font-mono text-sm mb-10">Three steps. One transaction. Zero trust.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { step: '01', icon: '📋', title: 'Load the Crew', desc: 'Paste a CSV of wallet addresses and amounts. Up to 50 targets per transmission.' },
                        { step: '02', icon: '🔑', title: 'Authorize', desc: 'Approve the registry to handle your tokens. One click via OP_WALLET.' },
                        { step: '03', icon: '📡', title: 'Broadcast', desc: 'Tokens beam to every wallet instantly — no claiming, no delays, on-chain forever.' },
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

            {/* Recent transmissions */}
            <section className="py-8 pb-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-display font-bold tracking-widest uppercase">
                        <span className="neon-cyan">RECENT</span> TRANSMISSIONS
                    </h2>
                    <Link to="/discover" className="text-od-pink hover:text-od-pink-lt transition-colors text-xs font-display tracking-widest uppercase">
                        Scan All →
                    </Link>
                </div>
                <CampaignGrid items={items} loading={loading} error={error} />
            </section>
        </div>
    );
}
