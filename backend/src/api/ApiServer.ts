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

// ---------------------------------------------------------------------------
// Magic Eden holder cache
// Caches holder lists (array of bc1p... Taproot addresses) per collection symbol.
// TTL: 10 minutes — holder lists change slowly and ME API is rate-limited.
// ---------------------------------------------------------------------------

interface CacheEntry {
    readonly addresses: readonly string[];
    readonly fetchedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const holderCache = new Map<string, CacheEntry>();

/** Paginate Magic Eden ord tokens API and collect all holder addresses for a collection. */
async function fetchMagicEdenHolders(collectionSymbol: string): Promise<readonly string[]> {
    const allAddresses = new Set<string>();
    const PAGE_SIZE = 100;
    let offset = 0;
    let totalFetched = 0;
    const MAX_PAGES = 150; // cap at 15,000 items to avoid infinite loops

    for (let page = 0; page < MAX_PAGES; page++) {
        const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=${encodeURIComponent(collectionSymbol)}&limit=${PAGE_SIZE}&offset=${offset}`;
        let res: Response;
        try {
            res = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'OpDrop/1.0 (airdrop tool)',
                },
            });
        } catch {
            break; // network error — return what we have
        }

        if (res.status === 429) {
            // Rate limited — wait 2 seconds and retry once
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
                res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            } catch {
                break;
            }
        }

        if (!res.ok) break;

        interface MagicEdenToken { readonly owner?: string }
        interface MagicEdenResponse { readonly tokens?: readonly MagicEdenToken[] }
        const data = await res.json() as MagicEdenResponse;
        const tokens = data.tokens ?? [];
        if (tokens.length === 0) break;

        for (const token of tokens) {
            if (token.owner && token.owner.startsWith('bc1')) {
                allAddresses.add(token.owner);
            }
        }

        totalFetched += tokens.length;
        offset += PAGE_SIZE;

        if (tokens.length < PAGE_SIZE) break; // last page
        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 120));
    }

    console.log(`[Holders] ${collectionSymbol}: fetched ${allAddresses.size} unique Taproot addresses (${totalFetched} items scanned)`);
    return Array.from(allAddresses);
}

async function getHoldersCached(collectionSymbol: string): Promise<readonly string[]> {
    const cached = holderCache.get(collectionSymbol);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.addresses;
    }
    const addresses = await fetchMagicEdenHolders(collectionSymbol);
    holderCache.set(collectionSymbol, { addresses, fetchedAt: Date.now() });
    return addresses;
}

// Known safe collection symbols for the /v1/holders endpoint
const ALLOWED_COLLECTIONS = new Set([
    'motocats',
    'bitcoin-puppets',
    'nodemonkes',
    'ordinal-maxi-biz',
    'quantum-cats',
    'bitcoin-frogs',
    'taproot-wizards',
]);

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

        // Ordinal collection holders — proxies Magic Eden with caching.
        // Returns { addresses: string[], count: number, source: string }
        // where addresses are Bitcoin Taproot (bc1p...) wallet addresses.
        this.#app.get('/v1/holders/:collection', async (req, res) => {
            const collection = req.path_parameters['collection'];
            if (!collection || !ALLOWED_COLLECTIONS.has(collection)) {
                res.status(400).json({ error: 'Unknown collection. Allowed: ' + [...ALLOWED_COLLECTIONS].join(', ') });
                return;
            }
            const addresses = await getHoldersCached(collection);
            res.json({
                collection,
                addresses,
                count: addresses.length,
                cachedAt: holderCache.get(collection)?.fetchedAt ?? 0,
                source: 'magic-eden-ordinals',
            });
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
        console.log(`[OpDrop API] Listening on http://0.0.0.0:${Config.port}`);
    }
}
