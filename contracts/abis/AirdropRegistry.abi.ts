import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const AirdropRegistryEvents = [
    {
        name: 'CampaignCreated',
        values: [
            { name: 'campaignId', type: ABIDataTypes.UINT256 },
            { name: 'creator', type: ABIDataTypes.ADDRESS },
            { name: 'token', type: ABIDataTypes.ADDRESS },
            { name: 'totalAmount', type: ABIDataTypes.UINT256 },
            { name: 'recipientCount', type: ABIDataTypes.UINT32 },
        ],
        type: BitcoinAbiTypes.Event,
    },
];

export const AirdropRegistryAbi = [
    {
        name: 'createCampaign',
        inputs: [
            { name: 'token', type: ABIDataTypes.ADDRESS },
            { name: 'entries', type: ABIDataTypes.ADDRESS_UINT256_TUPLE },
        ],
        outputs: [{ name: 'campaignId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getCampaign',
        constant: true,
        inputs: [{ name: 'campaignId', type: ABIDataTypes.UINT256 }],
        outputs: [
            { name: 'creator', type: ABIDataTypes.BYTES32 },
            { name: 'token', type: ABIDataTypes.BYTES32 },
            { name: 'totalAmount', type: ABIDataTypes.UINT256 },
            { name: 'recipientCount', type: ABIDataTypes.UINT32 },
            { name: 'blockHeight', type: ABIDataTypes.UINT256 },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getCampaignCount',
        constant: true,
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    ...AirdropRegistryEvents,
    ...OP_NET_ABI,
];

export default AirdropRegistryAbi;
