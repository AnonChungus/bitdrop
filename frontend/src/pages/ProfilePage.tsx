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
                    <div className="w-12 h-12 border border-od-cyan/30 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: 'rgba(0,240,255,0.05)' }}>
                        📡
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-black tracking-widest uppercase">
                            <span className="neon-cyan">{addr ? formatAddress(addr, 10) : 'OPERATOR'}</span>
                        </h1>
                        <p className="text-od-muted text-xs font-mono">
                            {addr}
                        </p>
                    </div>
                </div>
                <p className="text-od-muted text-sm font-mono mt-1">
                    {total} signals broadcast
                </p>
            </div>

            <CampaignGrid
                items={items}
                loading={loading}
                error={error}
                emptyMessage="No transmissions from this operator yet."
            />
        </div>
    );
}
