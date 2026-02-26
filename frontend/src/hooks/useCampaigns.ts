import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/ApiService.js';
import type { CampaignListItem } from '../types/campaign.js';

export function useCampaigns(params: {
    page?: number;
    limit?: number;
    creator?: string;
} = {}): {
    readonly items: readonly CampaignListItem[];
    readonly total: number;
    readonly loading: boolean;
    readonly error: string | null;
    readonly refetch: () => void;
} {
    const [items, setItems] = useState<readonly CampaignListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback((): void => {
        setLoading(true);
        setError(null);
        ApiService.getCampaigns(params)
            .then((result) => {
                setItems(result.items);
                setTotal(result.total);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [params.page, params.limit, params.creator]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { items, total, loading, error, refetch: fetch };
}
