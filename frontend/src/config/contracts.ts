export const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';

export const NETWORK = (import.meta.env['VITE_NETWORK'] ?? 'regtest') as 'regtest' | 'mainnet';

export const AIRDROP_REGISTRY_ADDRESS =
    import.meta.env['VITE_REGISTRY_ADDRESS'] ??
    '0x0000000000000000000000000000000000000000000000000000000000000001';

export const OPNET_RPC_URL =
    import.meta.env['VITE_OPNET_RPC'] ?? 'http://localhost:9001';
