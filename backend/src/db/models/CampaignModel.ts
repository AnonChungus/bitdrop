export interface ICampaign {
    readonly campaignId: string;       // u256 as decimal string
    readonly creator: string;           // OPNet address
    readonly tokenAddress: string;      // OP20 token address
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly totalAmount: string;       // bigint as string
    readonly recipientCount: number;
    readonly blockHeight: string;       // bigint as string
    readonly txHash: string;
    readonly createdAt: Date;
}
