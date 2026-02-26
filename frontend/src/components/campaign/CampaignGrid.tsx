import { CampaignCard } from './CampaignCard.js';
import { Spinner } from '../common/Spinner.js';
import type { CampaignListItem } from '../../types/campaign.js';

interface CampaignGridProps {
    readonly items: readonly CampaignListItem[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly emptyMessage?: string;
}

export function CampaignGrid({
    items,
    loading,
    error,
    emptyMessage = 'No transmissions yet.',
}: CampaignGridProps): JSX.Element {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-4xl mb-3">📡</p>
                <p className="text-red-400 font-display tracking-widest uppercase text-sm mb-1">Signal Lost</p>
                <p className="text-od-muted text-sm max-w-sm mx-auto font-mono">{error}</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20 text-od-muted">
                <p className="text-4xl mb-3">📡</p>
                <p className="font-mono">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((campaign) => (
                <CampaignCard key={campaign.campaignId} campaign={campaign} />
            ))}
        </div>
    );
}
