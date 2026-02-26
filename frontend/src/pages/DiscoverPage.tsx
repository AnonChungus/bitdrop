import { useState } from 'react';
import { CampaignGrid } from '../components/campaign/CampaignGrid.js';
import { useCampaigns } from '../hooks/useCampaigns.js';

export function DiscoverPage(): JSX.Element {
    const [page, setPage] = useState(1);
    const limit = 12;
    const { items, total, loading, error } = useCampaigns({ page, limit });

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-widest uppercase">
                        <span className="neon-pink">SCAN</span>{' '}
                        <span className="text-od-text">THE GRID</span>
                    </h1>
                    <p className="text-od-muted mt-1 font-mono text-sm">{total} transmissions recorded on Bitcoin L1</p>
                </div>
            </div>

            <CampaignGrid
                items={items}
                loading={loading}
                error={error}
                emptyMessage="No transmissions yet. Be the first to broadcast on Bitcoin."
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-od-border text-od-muted hover:text-od-cyan hover:border-od-cyan/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-display tracking-widest uppercase rounded"
                    >
                        ← PREV
                    </button>
                    <span className="text-od-muted text-xs font-mono px-4">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-od-border text-od-muted hover:text-od-cyan hover:border-od-cyan/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-display tracking-widest uppercase rounded"
                    >
                        NEXT →
                    </button>
                </div>
            )}
        </div>
    );
}
