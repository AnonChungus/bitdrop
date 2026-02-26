import HyperExpress from '@btc-vision/hyper-express';
import { CampaignRepository } from '../db/repositories/CampaignRepository.js';
import { Config } from '../config/Config.js';
import type { CampaignDto, PaginatedResult, StatsDto } from '../types/ApiTypes.js';
import type { ICampaign } from '../db/models/CampaignModel.js';

function toCampaignDto(c: ICampaign): CampaignDto {
    return {
        campaignId:     c.campaignId,
        creator:        c.creator,
        tokenAddress:   c.tokenAddress,
        tokenName:      c.tokenName,
        tokenSymbol:    c.tokenSymbol,
        totalAmount:    c.totalAmount,
        recipientCount: c.recipientCount,
        blockHeight:    c.blockHeight,
        txHash:         c.txHash,
        createdAt:      c.createdAt.toISOString(),
    };
}

export class ApiServer {
    readonly #app: HyperExpress.Server;

    public constructor() {
        this.#app = new HyperExpress.Server({ max_body_length: 1_000_000 });
        this.#setupMiddleware();
        this.#setupRoutes();
    }

    #setupMiddleware(): void {
        this.#app.use((req, res, next) => {
            const origin = req.headers['origin'] ?? Config.corsOrigin;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.status(204).end();
                return;
            }
            if (next) next();
        });
    }

    #setupRoutes(): void {
        // Health
        this.#app.get('/health', (_req, res) => {
            res.json({ status: 'ok', timestamp: Date.now() });
        });

        // Stats
        this.#app.get('/v1/stats', async (_req, res) => {
            const stats = await CampaignRepository.getStats();
            const dto: StatsDto = {
                totalCampaigns:  stats.totalCampaigns,
                totalRecipients: stats.totalRecipients,
            };
            res.json(dto);
        });

        // List campaigns
        this.#app.get('/v1/campaigns', async (req, res) => {
            const page  = Math.max(1, parseInt(req.query_parameters['page'] ?? '1', 10));
            const limit = Math.min(50, Math.max(1, parseInt(req.query_parameters['limit'] ?? '20', 10)));
            const creator = req.query_parameters['creator'];

            const result = await CampaignRepository.findAll({
                page,
                limit,
                ...(creator !== undefined ? { creator } : {}),
            });
            const dto: PaginatedResult<CampaignDto> = {
                items: result.items.map(toCampaignDto),
                total: result.total,
                page,
                limit,
            };
            res.json(dto);
        });

        // Single campaign
        this.#app.get('/v1/campaigns/:id', async (req, res) => {
            const id = req.path_parameters['id'];
            if (!id) {
                res.status(400).json({ error: 'Missing campaign id' });
                return;
            }
            const campaign = await CampaignRepository.findById(id);
            if (!campaign) {
                res.status(404).json({ error: 'Campaign not found' });
                return;
            }
            res.json(toCampaignDto(campaign));
        });

        // Index a new campaign (called by indexer or frontend post-launch)
        this.#app.post('/v1/campaigns', async (req, res) => {
            const body = await req.json() as Record<string, unknown>;
            const {
                campaignId, creator, tokenAddress, tokenName, tokenSymbol,
                totalAmount, recipientCount, blockHeight, txHash,
            } = body;

            if (!campaignId || !creator || !tokenAddress || !txHash) {
                res.status(400).json({ error: 'Missing required fields: campaignId, creator, tokenAddress, txHash' });
                return;
            }

            try {
                const campaign = await CampaignRepository.create({
                    campaignId:     String(campaignId),
                    creator:        String(creator),
                    tokenAddress:   String(tokenAddress),
                    tokenName:      String(tokenName ?? ''),
                    tokenSymbol:    String(tokenSymbol ?? ''),
                    totalAmount:    String(totalAmount ?? '0'),
                    recipientCount: Number(recipientCount ?? 0),
                    blockHeight:    String(blockHeight ?? '0'),
                    txHash:         String(txHash),
                });
                res.status(201).json(toCampaignDto(campaign));
            } catch (err: unknown) {
                const error = err as { code?: number; message?: string };
                if (error.code === 11000) {
                    res.status(409).json({ error: 'Campaign already indexed' });
                } else {
                    throw err;
                }
            }
        });
    }

    public async listen(): Promise<void> {
        await this.#app.listen(Config.port, '0.0.0.0');
        console.log(`[BitDrop API] http://0.0.0.0:${Config.port}`);
    }
}
