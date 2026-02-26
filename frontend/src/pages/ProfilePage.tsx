import { useParams } from 'react-router-dom';
import { CampaignGrid } from '../components/campaign/CampaignGrid.js';
import { useCampaigns } from '../hooks/useCampaigns.js';
import { formatAddress } from '../utils/formatting.js';

export function ProfilePage(): JSX.Element {
    const { addr } = useParams<{ addr: string }>();
    const { items, total, loading, error } = useCampaigns(
        addr !== undefined ? { creator: addr } : {},
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-bd-purple/20 rounded-xl flex items-center justify-center text-2xl">
                        👤
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-bd-text">
                            {addr ? formatAddress(addr, 10) : 'Profile'}
                        </h1>
                        <p className="text-bd-muted text-sm font-mono text-xs">
                            {addr}
                        </p>
                    </div>
                </div>
                <p className="text-bd-muted">{total} campaigns created</p>
            </div>

            <CampaignGrid
                items={items}
                loading={loading}
                error={error}
                emptyMessage="No campaigns created yet."
            />
        </div>
    );
}
