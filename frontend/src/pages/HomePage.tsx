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
            <section className="py-20 text-center">
                {/* Glow orb */}
                <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
                    <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[600px] h-[600px] rounded-full bg-bd-purple/10 blur-3xl" />
                </div>

                <div className="relative">
                    <div className="inline-flex items-center gap-2 bg-bd-purple/10 border border-bd-purple/30 rounded-full px-4 py-1.5 text-sm text-bd-purple-lt mb-6">
                        <span className="w-2 h-2 bg-bd-purple-lt rounded-full animate-pulse" />
                        Live on Bitcoin L1 via OPNet
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-black text-bd-text mb-6 leading-tight">
                        Drop tokens to any
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-bd-purple to-bd-purple-lt">
                            community on Bitcoin
                        </span>
                    </h1>

                    <p className="text-bd-muted text-xl max-w-2xl mx-auto mb-10">
                        The first permissionless airdrop machine on Bitcoin L1.
                        Upload a list, approve tokens, launch — done in one transaction.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/create"
                            className="bg-bd-purple hover:bg-bd-purple-dk text-white font-bold px-8 py-4 rounded-xl text-lg transition-all glow-purple"
                        >
                            Create Airdrop
                        </Link>
                        <Link
                            to="/discover"
                            className="border border-bd-border hover:border-bd-purple/50 text-bd-text font-bold px-8 py-4 rounded-xl text-lg transition-all"
                        >
                            Browse Campaigns
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            {stats && (
                <section className="py-8">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                        {[
                            { label: 'Campaigns Launched', value: stats.totalCampaigns.toLocaleString() },
                            { label: 'Total Recipients', value: stats.totalRecipients.toLocaleString() },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-bd-card border border-bd-border rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-bd-purple-lt">{stat.value}</p>
                                <p className="text-sm text-bd-muted mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* How it works */}
            <section className="py-12">
                <h2 className="text-2xl font-bold text-bd-text text-center mb-8">How it works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { step: '1', icon: '📋', title: 'Upload recipients', desc: 'Paste a CSV of wallet addresses and amounts. Supports up to 50 recipients per campaign.' },
                        { step: '2', icon: '✅', title: 'Approve & launch', desc: 'Approve the registry contract to spend your tokens, then launch the campaign in one click.' },
                        { step: '3', icon: '🎯', title: 'Instant delivery', desc: 'Tokens land in recipient wallets immediately — no claiming required.' },
                    ].map((item) => (
                        <div key={item.step} className="bg-bd-card border border-bd-border rounded-xl p-6 text-center">
                            <div className="w-10 h-10 bg-bd-purple/20 border border-bd-purple/30 rounded-full flex items-center justify-center text-bd-purple-lt font-bold text-sm mx-auto mb-4">
                                {item.step}
                            </div>
                            <div className="text-3xl mb-3">{item.icon}</div>
                            <h3 className="font-bold text-bd-text mb-2">{item.title}</h3>
                            <p className="text-bd-muted text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent campaigns */}
            <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-bd-text">Recent Campaigns</h2>
                    <Link to="/discover" className="text-bd-purple-lt hover:underline text-sm">
                        View all →
                    </Link>
                </div>
                <CampaignGrid items={items} loading={loading} error={error} />
            </section>
        </div>
    );
}
