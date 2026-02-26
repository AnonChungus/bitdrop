/**
 * Premade airdrop target lists — ordinal/OP20 community snapshots.
 *
 * Addresses are Bitcoin Taproot (bc1p...) format — the native OPNet address type.
 * Lists are fetched live from the backend which proxies Magic Eden with a 10-min cache.
 *
 * Collections covered:
 *  - Motocats         — OPNet/MotoSwap ecosystem ordinals
 *  - Bitcoin Puppets  — Top-10 Ordinals by market cap
 *  - NodeMonkes       — Top-5 Ordinals by market cap
 *  - Ordinal Maxi Biz — High-conviction Bitcoin-native holders
 *  - Quantum Cats     — BIP-420 advocacy / Bitcoin protocol community
 *  - Bitcoin Frogs    — Large early-adopter community
 *  - Taproot Wizards  — Bitcoin culture icons (Udi Wertheimer + community)
 */

export interface PremadeList {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly icon: string;
    readonly collectionSymbol: string;  // Magic Eden collection symbol
    readonly estimatedCount: number;    // approximate supply for UI display
    readonly suggestedAmountEach?: bigint; // default OP20 amount per address
}

export const ALL_PREMADE_LISTS: readonly PremadeList[] = [
    {
        id:                'motocats',
        label:             'Motocats Holders',
        description:       'OPNet / MotoSwap ecosystem ordinal holders',
        icon:              '🐱',
        collectionSymbol:  'motocats',
        estimatedCount:    3_300,
    },
    {
        id:                'bitcoin-puppets',
        label:             'Bitcoin Puppets Holders',
        description:       'Top-10 Bitcoin Ordinals by market cap (10,000 supply)',
        icon:              '🎭',
        collectionSymbol:  'bitcoin-puppets',
        estimatedCount:    10_000,
    },
    {
        id:                'nodemonkes',
        label:             'NodeMonkes Holders',
        description:       'Consistently top-5 Bitcoin Ordinals by market cap (10,000 supply)',
        icon:              '🐵',
        collectionSymbol:  'nodemonkes',
        estimatedCount:    10_000,
    },
    {
        id:                'ordinal-maxi-biz',
        label:             'Ordinal Maxi Biz (OMB)',
        description:       'High-conviction Bitcoin-native holders (572 supply, premium floor)',
        icon:              '💼',
        collectionSymbol:  'ordinal-maxi-biz',
        estimatedCount:    572,
    },
    {
        id:                'quantum-cats',
        label:             'Quantum Cats Holders',
        description:       'BIP-420 advocacy / Bitcoin protocol upgrades community',
        icon:              '🐱',
        collectionSymbol:  'quantum-cats',
        estimatedCount:    3_333,
    },
    {
        id:                'bitcoin-frogs',
        label:             'Bitcoin Frogs Holders',
        description:       'Large early-adopter Bitcoin Ordinals community (10,000 supply)',
        icon:              '🐸',
        collectionSymbol:  'bitcoin-frogs',
        estimatedCount:    10_000,
    },
    {
        id:                'taproot-wizards',
        label:             'Taproot Wizards Holders',
        description:       'Bitcoin culture icons — co-created by Udi Wertheimer (2,106 supply)',
        icon:              '🧙',
        collectionSymbol:  'taproot-wizards',
        estimatedCount:    2_106,
    },
];
