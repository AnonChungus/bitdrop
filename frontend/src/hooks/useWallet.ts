import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '../types/wallet.js';

interface OpWallet {
    readonly requestAccounts: () => Promise<string[]>;
    readonly getNetwork: () => Promise<string>;
    on(event: string, handler: () => void): void;
    removeListener(event: string, handler: () => void): void;
}

declare global {
    interface Window {
        opnet?: OpWallet;
    }
}

const INITIAL_WALLET: WalletState = {
    connected: false,
    address:   '',
    network:   '',
};

export function useWallet(): {
    readonly wallet: WalletState;
    readonly connect: () => Promise<void>;
    readonly disconnect: () => void;
} {
    const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);

    const connect = useCallback(async (): Promise<void> => {
        const opnet = window.opnet;
        if (!opnet) {
            alert('OP_WALLET not found — please install the extension');
            return;
        }
        const accounts = await opnet.requestAccounts();
        const rawNetwork = await opnet.getNetwork();
        const address = accounts[0] ?? '';
        // OP_WALLET returns "livenet" for mainnet — remap
        const network =
            rawNetwork === 'livenet' ? 'mainnet' : rawNetwork;
        setWallet({ connected: true, address, network });
    }, []);

    const disconnect = useCallback((): void => {
        setWallet(INITIAL_WALLET);
    }, []);

    // Auto-reconnect on account change
    useEffect(() => {
        const opnet = window.opnet;
        if (!opnet) return;

        const handler = (): void => {
            void connect();
        };
        opnet.on('accountsChanged', handler);
        return () => opnet.removeListener('accountsChanged', handler);
    }, [connect]);

    return { wallet, connect, disconnect };
}
