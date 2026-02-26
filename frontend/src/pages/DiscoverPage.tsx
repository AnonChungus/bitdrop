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
                    <h1 className="text-3xl font-bold text-bd-text">Discover Airdrops</h1>
                    <p className="text-bd-muted mt-1">{total} campaigns on Bitcoin L1</p>
                </div>
            </div>

            <CampaignGrid
                items={items}
                loading={loading}
                error={error}
                emptyMessage="No campaigns yet. Be the first to launch an airdrop on Bitcoin!"
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-bd-border text-bd-muted hover:text-bd-text hover:border-bd-purple/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        ← Prev
                    </button>
                    <span className="text-bd-muted text-sm px-4">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg border border-bd-border text-bd-muted hover:text-bd-text hover:border-bd-purple/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
