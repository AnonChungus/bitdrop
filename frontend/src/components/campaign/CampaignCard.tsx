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
            className="block card-neon rounded-xl p-4 group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-display font-bold neon-cyan truncate">
                            {campaign.tokenSymbol || '???'}
                        </span>
                        {campaign.tokenName && (
                            <span className="text-xs text-od-muted font-mono truncate">
                                {campaign.tokenName}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-od-muted font-mono">
                        {formatAddress(campaign.creator)}
                    </p>
                </div>
                <div className="text-2xl flicker">📡</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-od-bg rounded-lg p-2 border border-od-border/50">
                    <p className="text-xs text-od-muted uppercase tracking-widest font-display">Signal</p>
                    <p className="text-sm font-mono font-semibold text-od-text mt-0.5">
                        {formatAmount(campaign.totalAmount)}
                    </p>
                    <p className="text-xs text-od-muted">
                        {campaign.tokenSymbol}
                    </p>
                </div>
                <div className="bg-od-bg rounded-lg p-2 border border-od-border/50">
                    <p className="text-xs text-od-muted uppercase tracking-widest font-display">Crew</p>
                    <p className="text-sm font-mono font-semibold neon-pink mt-0.5">
                        {campaign.recipientCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-od-muted">addresses</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-od-border">
                <span className="text-xs text-od-muted font-mono">
                    {formatTimeAgo(campaign.createdAt)}
                </span>
                <span className="text-xs neon-cyan group-hover:translate-x-0.5 transition-transform font-display">
                    TUNE IN →
                </span>
            </div>
        </Link>
    );
}
