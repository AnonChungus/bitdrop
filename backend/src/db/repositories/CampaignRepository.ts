import type { Filter } from 'mongodb';
import { getCollection } from '../MongoClient.js';
import type { ICampaign } from '../models/CampaignModel.js';

const COLLECTION = 'campaigns';

export interface CampaignCreateInput {
    readonly campaignId: string;
    readonly creator: string;
    readonly tokenAddress: string;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly totalAmount: string;
    readonly recipientCount: number;
    readonly blockHeight: string;
    readonly txHash: string;
}

export const CampaignRepository = {
    async create(input: CampaignCreateInput): Promise<ICampaign> {
        const col = getCollection<ICampaign>(COLLECTION);
        const doc: ICampaign = { ...input, createdAt: new Date() };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await col.insertOne(doc as any);
        return doc;
    },

    async findById(campaignId: string): Promise<ICampaign | null> {
        const col = getCollection<ICampaign>(COLLECTION);
        return col.findOne({ campaignId } as Filter<ICampaign>, { projection: { _id: 0 } });
    },

    async findAll(params: {
        page: number;
        limit: number;
        creator?: string;
    }): Promise<{ items: ICampaign[]; total: number }> {
        const col = getCollection<ICampaign>(COLLECTION);
        const filter: Filter<ICampaign> = params.creator !== undefined
            ? { creator: params.creator } as Filter<ICampaign>
            : {};

        const skip = (params.page - 1) * params.limit;
        const [items, total] = await Promise.all([
            col
                .find(filter, { projection: { _id: 0 } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(params.limit)
                .toArray(),
            col.countDocuments(filter),
        ]);
        return { items, total };
    },

    async getStats(): Promise<{ totalCampaigns: number; totalRecipients: number }> {
        const col = getCollection<ICampaign>(COLLECTION);
        const [totalCampaigns, agg] = await Promise.all([
            col.countDocuments(),
            col
                .aggregate<{ total: number }>([
                    { $group: { _id: null, total: { $sum: '$recipientCount' } } },
                ])
                .toArray(),
        ]);
        const totalRecipients = agg[0]?.total ?? 0;
        return { totalCampaigns, totalRecipients };
    },

    async ensureIndexes(): Promise<void> {
        const col = getCollection<ICampaign>(COLLECTION);
        await col.createIndex({ campaignId: 1 }, { unique: true });
        await col.createIndex({ creator: 1 });
        await col.createIndex({ createdAt: -1 });
    },
};
