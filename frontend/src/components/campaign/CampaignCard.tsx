import { Link } from 'react-router-dom';
import type { CampaignListItem } from '../../types/campaign.js';
import { formatAddress, formatAmount, formatTimeAgo } from '../../utils/formatting.js';

interface CampaignCardProps {
    readonly campaign: CampaignListItem;
}

export function CampaignCard({ campaign }: CampaignCardProps): JSX.Element {
    return (
        <Link
            to={`/campaign/${campaign.campaignId}`}
            className="block bg-bd-card border border-bd-border rounded-xl p-4 hover:border-bd-purple/50 transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-bd-text truncate">
                            {campaign.tokenSymbol || '???'}
                        </span>
                        {campaign.tokenName && (
                            <span className="text-xs text-bd-muted truncate">
                                {campaign.tokenName}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-bd-muted font-mono">
                        {formatAddress(campaign.creator)}
                    </p>
                </div>
                <div className="text-2xl">🪂</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-bd-bg rounded-lg p-2">
                    <p className="text-xs text-bd-muted">Total Airdrop</p>
                    <p className="text-sm font-mono font-semibold text-bd-text mt-0.5">
                        {formatAmount(campaign.totalAmount)}
                    </p>
                    <p className="text-xs text-bd-muted">
                        {campaign.tokenSymbol}
                    </p>
                </div>
                <div className="bg-bd-bg rounded-lg p-2">
                    <p className="text-xs text-bd-muted">Recipients</p>
                    <p className="text-sm font-mono font-semibold text-bd-purple-lt mt-0.5">
                        {campaign.recipientCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-bd-muted">addresses</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-bd-border">
                <span className="text-xs text-bd-muted">
                    {formatTimeAgo(campaign.createdAt)}
                </span>
                <span className="text-xs text-bd-purple-lt group-hover:translate-x-0.5 transition-transform">
                    View →
                </span>
            </div>
        </Link>
    );
}
