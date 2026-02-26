export interface PaginatedResult<T> {
    readonly items: readonly T[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

export interface CampaignDto {
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

export interface StatsDto {
    readonly totalCampaigns: number;
    readonly totalRecipients: number;
}
