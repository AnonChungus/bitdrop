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
                <p className="text-bd-danger">{error ?? 'Campaign not found'}</p>
                <Link to="/discover" className="text-bd-purple-lt hover:underline mt-4 block">
                    ← Back to Discover
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-bd-purple/20 rounded-xl flex items-center justify-center text-3xl">
                    🪂
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-bd-text">
                        {campaign.tokenSymbol || 'Unknown Token'} Airdrop
                    </h1>
                    <p className="text-bd-muted text-sm">
                        Campaign #{campaign.campaignId} · {formatTimeAgo(campaign.createdAt)}
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Airdropped', value: formatAmount(campaign.totalAmount), sub: campaign.tokenSymbol },
                    { label: 'Recipients', value: campaign.recipientCount.toLocaleString(), sub: 'addresses' },
                    { label: 'Block', value: campaign.blockHeight.toLocaleString(), sub: 'Bitcoin block' },
                    { label: 'Avg per wallet', value: formatAmount(campaign.totalAmount / BigInt(campaign.recipientCount || 1)), sub: campaign.tokenSymbol },
                ].map((stat) => (
                    <div key={stat.label} className="bg-bd-card border border-bd-border rounded-xl p-3">
                        <p className="text-xs text-bd-muted">{stat.label}</p>
                        <p className="text-sm font-mono font-semibold text-bd-text mt-0.5">{stat.value}</p>
                        {stat.sub && <p className="text-xs text-bd-muted">{stat.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Details */}
            <div className="bg-bd-card border border-bd-border rounded-xl p-5 space-y-4">
                <h2 className="font-semibold text-bd-text">Campaign Details</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-bd-border">
                        <span className="text-bd-muted">Token Contract</span>
                        <span className="font-mono text-bd-text text-xs">{formatAddress(campaign.tokenAddress, 10)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-bd-border">
                        <span className="text-bd-muted">Created by</span>
                        <span className="font-mono text-bd-text text-xs">
                            <Link
                                to={`/profile/${campaign.creator}`}
                                className="hover:text-bd-purple-lt transition-colors"
                            >
                                {formatAddress(campaign.creator, 10)}
                            </Link>
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-bd-border">
                        <span className="text-bd-muted">Transaction</span>
                        <span className="font-mono text-bd-text text-xs">{formatAddress(campaign.txHash, 10)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-bd-muted">Status</span>
                        <span className="flex items-center gap-1.5 text-bd-success text-xs font-semibold">
                            <span className="w-2 h-2 bg-bd-success rounded-full" />
                            Completed
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <Link
                    to="/discover"
                    className="flex-1 text-center border border-bd-border hover:border-bd-purple/50 rounded-xl py-3 text-sm text-bd-muted hover:text-bd-text transition-all"
                >
                    ← All Campaigns
                </Link>
                <Link
                    to="/create"
                    className="flex-1 text-center bg-bd-purple hover:bg-bd-purple-dk rounded-xl py-3 text-sm text-white font-semibold transition-all"
                >
                    Create Your Own 🚀
                </Link>
            </div>
        </div>
    );
}
