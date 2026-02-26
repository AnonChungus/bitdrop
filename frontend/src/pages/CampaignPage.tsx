import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '../services/ApiService.js';
import { Spinner } from '../components/common/Spinner.js';
import { formatAddress, formatAmount, formatTimeAgo } from '../utils/formatting.js';
import type { Campaign } from '../types/campaign.js';

export function CampaignPage(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        ApiService.getCampaign(id)
            .then(setCampaign)
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <p className="text-4xl mb-4 flicker">📡</p>
                <p className="text-red-400 font-display tracking-widest uppercase text-sm mb-4">{error ?? 'Transmission not found'}</p>
                <Link to="/discover" className="text-od-cyan hover:text-od-cyan-dk transition-colors text-sm font-display tracking-widest">
                    ← SCAN THE GRID
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 border border-od-pink/30 rounded-xl flex items-center justify-center text-3xl flicker"
                    style={{ background: 'rgba(255,45,120,0.05)' }}>
                    📡
                </div>
                <div>
                    <h1 className="text-2xl font-display font-black tracking-widest">
                        <span className="neon-cyan">{campaign.tokenSymbol || '???'}</span>{' '}
                        <span className="text-od-text">TRANSMISSION</span>
                    </h1>
                    <p className="text-od-muted text-xs font-mono">
                        Signal #{campaign.campaignId} · {formatTimeAgo(campaign.createdAt)}
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'TOTAL SIGNAL', value: formatAmount(campaign.totalAmount), sub: campaign.tokenSymbol, color: 'text-od-text' },
                    { label: 'CREW SIZE', value: campaign.recipientCount.toLocaleString(), sub: 'addresses', color: 'neon-pink' },
                    { label: 'BLOCK', value: campaign.blockHeight.toLocaleString(), sub: 'Bitcoin block', color: 'neon-cyan' },
                    { label: 'AVG / WALLET', value: formatAmount(campaign.totalAmount / BigInt(campaign.recipientCount || 1)), sub: campaign.tokenSymbol, color: 'text-od-text' },
                ].map((stat) => (
                    <div key={stat.label} className="card-neon rounded-xl p-3">
                        <p className="text-xs text-od-muted font-display tracking-widest">{stat.label}</p>
                        <p className={`text-sm font-mono font-semibold mt-0.5 ${stat.color}`}>{stat.value}</p>
                        {stat.sub && <p className="text-xs text-od-muted font-mono">{stat.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Details */}
            <div className="card-neon rounded-xl p-5 space-y-4">
                <h2 className="font-display font-bold text-od-text text-xs tracking-widest uppercase">Transmission Details</h2>
                <div className="space-y-0 text-sm">
                    {[
                        { label: 'Token Contract', value: formatAddress(campaign.tokenAddress, 10), className: 'text-od-cyan font-mono' },
                        { label: 'Broadcaster', value: formatAddress(campaign.creator, 10), className: 'text-od-cyan font-mono', link: `/profile/${campaign.creator}` },
                        { label: 'Transaction', value: formatAddress(campaign.txHash, 10), className: 'text-od-muted font-mono' },
                    ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center py-2.5 border-b border-od-border/50">
                            <span className="text-od-muted text-xs font-display tracking-widest uppercase">{row.label}</span>
                            {row.link ? (
                                <Link to={row.link} className={`text-xs hover:text-od-pink transition-colors ${row.className}`}>
                                    {row.value}
                                </Link>
                            ) : (
                                <span className={`text-xs ${row.className}`}>{row.value}</span>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-between items-center py-2.5">
                        <span className="text-od-muted text-xs font-display tracking-widest uppercase">Status</span>
                        <span className="flex items-center gap-1.5 text-od-green text-xs font-display tracking-widest"
                            style={{ textShadow: '0 0 6px #39FF14' }}>
                            <span className="w-2 h-2 bg-od-green rounded-full animate-pulse" />
                            CONFIRMED
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <Link
                    to="/discover"
                    className="flex-1 text-center border border-od-border hover:border-od-cyan/50 rounded-xl py-3 text-xs text-od-muted hover:text-od-cyan transition-all font-display tracking-widest uppercase"
                >
                    ← ALL SIGNALS
                </Link>
                <Link
                    to="/create"
                    className="flex-1 text-center btn-neon-pink rounded-xl py-3 text-xs font-display font-bold tracking-widest uppercase"
                >
                    BROADCAST YOURS 📡
                </Link>
            </div>
        </div>
    );
}
