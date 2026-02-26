import 'dotenv/config';
import { connectMongo } from './db/MongoClient.js';
import { CampaignRepository } from './db/repositories/CampaignRepository.js';
import { ApiServer } from './api/ApiServer.js';

async function main(): Promise<void> {
    await connectMongo();
    await CampaignRepository.ensureIndexes();

    const server = new ApiServer();
    await server.listen();
}

main().catch((err: unknown) => {
    console.error('[BitDrop] Fatal:', err);
    process.exit(1);
});
