import { API_BASE_URL } from '../config/contracts.js';
import type { Campaign, CampaignListItem } from '../types/campaign.js';

interface ApiCampaign {
    readonly campaignId: string;
    readonly creator: string;
    readonly tokenAddress: string;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly totalAmount: string;
    readonly recipientCount: number;
    readonly blockHeight: string;
    readonly txHash: string;
    readonly createdAt: string;
}

interface PaginatedResult<T> {
    readonly items: readonly T[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
    } catch {
        throw new Error('Backend offline — start the API server');
    }
    if (!res.ok) {
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('text/html')) {
            throw new Error(`API ${res.status} — backend not reachable at ${API_BASE_URL}`);
        }
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

function parseCampaign(d: ApiCampaign): Campaign {
    return {
        campaignId:     d.campaignId,
        creator:        d.creator,
        tokenAddress:   d.tokenAddress,
        tokenName:      d.tokenName,
        tokenSymbol:    d.tokenSymbol,
        totalAmount:    BigInt(d.totalAmount),
        recipientCount: d.recipientCount,
        blockHeight:    BigInt(d.blockHeight),
        txHash:         d.txHash,
        createdAt:      d.createdAt,
    };
}

function parseCampaignListItem(d: ApiCampaign): CampaignListItem {
    return {
        campaignId:     d.campaignId,
        creator:        d.creator,
        tokenAddress:   d.tokenAddress,
        tokenName:      d.tokenName,
        tokenSymbol:    d.tokenSymbol,
        totalAmount:    BigInt(d.totalAmount),
        recipientCount: d.recipientCount,
        createdAt:      d.createdAt,
    };
}

export const ApiService = {
    async getCampaigns(params: {
        page?: number;
        limit?: number;
        creator?: string;
    } = {}): Promise<PaginatedResult<CampaignListItem>> {
        const qs = new URLSearchParams();
        if (params.page)    qs.set('page', String(params.page));
        if (params.limit)   qs.set('limit', String(params.limit));
        if (params.creator) qs.set('creator', params.creator);

        const result = await fetchJson<PaginatedResult<ApiCampaign>>(`/v1/campaigns?${qs}`);
        return {
            items: result.items.map(parseCampaignListItem),
            total: result.total,
            page:  result.page,
            limit: result.limit,
        };
    },

    async getCampaign(id: string): Promise<Campaign> {
        const result = await fetchJson<ApiCampaign>(`/v1/campaigns/${id}`);
        return parseCampaign(result);
    },

    async getStats(): Promise<{ totalCampaigns: number; totalRecipients: number }> {
        return fetchJson('/v1/stats');
    },

    /**
     * Fetch Bitcoin Taproot (bc1p...) holder addresses for a named ordinal collection.
     * Backend proxies Magic Eden with a 10-minute cache.
     */
    async getCollectionHolders(collectionSymbol: string): Promise<{ addresses: readonly string[]; count: number }> {
        return fetchJson(`/v1/holders/${encodeURIComponent(collectionSymbol)}`);
    },
};
