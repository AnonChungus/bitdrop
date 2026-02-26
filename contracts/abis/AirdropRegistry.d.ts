import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------
export type CampaignCreatedEvent = {
    readonly campaignId: bigint;
    readonly creator: Address;
    readonly token: Address;
    readonly totalAmount: bigint;
    readonly recipientCount: number;
};

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the createCampaign function call.
 */
export type CreateCampaign = CallResult<
    {
        campaignId: bigint;
    },
    OPNetEvent<CampaignCreatedEvent>[]
>;

/**
 * @description Represents the result of the getCampaign function call.
 */
export type GetCampaign = CallResult<
    {
        creator: Uint8Array;
        token: Uint8Array;
        totalAmount: bigint;
        recipientCount: number;
        blockHeight: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getCampaignCount function call.
 */
export type GetCampaignCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IAirdropRegistry
// ------------------------------------------------------------------
export interface IAirdropRegistry extends IOP_NETContract {
    createCampaign(token: Address, entries: AddressMap<bigint>): Promise<CreateCampaign>;
    getCampaign(campaignId: bigint): Promise<GetCampaign>;
    getCampaignCount(): Promise<GetCampaignCount>;
}
