export interface Campaign {
    readonly campaignId: string;
    readonly creator: string;
    readonly tokenAddress: string;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly totalAmount: bigint;
    readonly recipientCount: number;
    readonly blockHeight: bigint;
    readonly txHash: string;
    readonly createdAt: string;
}

export interface CampaignListItem {
    readonly campaignId: string;
    readonly creator: string;
    readonly tokenAddress: string;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly totalAmount: bigint;
    readonly recipientCount: number;
    readonly createdAt: string;
}

export interface AirdropEntry {
    readonly address: string;
    readonly amount: bigint;
}

export interface CreateCampaignForm {
    readonly tokenAddress: string;
    readonly entries: readonly AirdropEntry[];
}
