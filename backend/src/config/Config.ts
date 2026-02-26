import 'dotenv/config';

function requireEnv(key: string, fallback?: string): string {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value;
}

export const Config = {
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    mongoUrl: requireEnv('MONGO_URL', 'mongodb://localhost:27017/bitdrop'),
    opnetRpcUrl: requireEnv('OPNET_RPC_URL', 'http://localhost:9001'),
    airdropRegistryAddress: requireEnv(
        'AIRDROP_REGISTRY_ADDRESS',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    ),
    network: (process.env['NETWORK'] ?? 'regtest') as 'regtest' | 'mainnet',
    corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
} as const;
