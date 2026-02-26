import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    encodeSelector,
    NetEvent,
    OP_NET,
    Revert,
    SafeMath,
    Selector,
    StoredMapU256,
    StoredU256,
} from '@btc-vision/btc-runtime/runtime';

// NOTE: @method, @returns, @emit, @final, and ABIDataTypes are compile-time
// globals from @btc-vision/opnet-transform. Do NOT import them.

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

class CampaignCreated extends NetEvent {
    public constructor(
        campaignId: u256,
        creator: Address,
        token: Address,
        totalAmount: u256,
        recipientCount: u32,
    ) {
        // u256(32) + address(32) + address(32) + u256(32) + u32(4) = 132 bytes
        const writer = new BytesWriter(132);
        writer.writeU256(campaignId);
        writer.writeAddress(creator);
        writer.writeAddress(token);
        writer.writeU256(totalAmount);
        writer.writeU32(recipientCount);
        super('CampaignCreated', writer);
    }
}

// ---------------------------------------------------------------------------
// AirdropRegistry
// ---------------------------------------------------------------------------

@final
export class AirdropRegistry extends OP_NET {
    // -----------------------------------------------------------------------
    // Selectors
    // -----------------------------------------------------------------------
    private readonly createCampaignSelector: Selector = encodeSelector(
        'createCampaign(address,tuple(address,uint256)[])',
    );
    private readonly getCampaignSelector: Selector = encodeSelector('getCampaign(uint256)');
    private readonly getCampaignCountSelector: Selector = encodeSelector('getCampaignCount()');

    // -----------------------------------------------------------------------
    // Cross-contract OP20 selectors
    // -----------------------------------------------------------------------
    private readonly transferSelector: Selector = encodeSelector('transfer(address,uint256)');
    private readonly transferFromSelector: Selector = encodeSelector(
        'transferFrom(address,address,uint256)',
    );

    // -----------------------------------------------------------------------
    // Storage pointers
    // -----------------------------------------------------------------------
    private readonly campaignCountPointer: u16 = Blockchain.nextPointer;
    private readonly campaignCreatorPointer: u16 = Blockchain.nextPointer;
    private readonly campaignTokenPointer: u16 = Blockchain.nextPointer;
    private readonly campaignTotalPointer: u16 = Blockchain.nextPointer;
    private readonly campaignRecipientCountPointer: u16 = Blockchain.nextPointer;
    private readonly campaignBlockPointer: u16 = Blockchain.nextPointer;

    // -----------------------------------------------------------------------
    // Storage instances
    // -----------------------------------------------------------------------
    // StoredU256(pointer, subPointer: Uint8Array) — subPointer acts as a namespace
    private readonly campaignCount: StoredU256 = new StoredU256(
        this.campaignCountPointer,
        new Uint8Array(30),
    );
    private readonly campaignCreator: StoredMapU256 = new StoredMapU256(
        this.campaignCreatorPointer,
    );
    private readonly campaignToken: StoredMapU256 = new StoredMapU256(this.campaignTokenPointer);
    private readonly campaignTotal: StoredMapU256 = new StoredMapU256(this.campaignTotalPointer);
    private readonly campaignRecipientCount: StoredMapU256 = new StoredMapU256(
        this.campaignRecipientCountPointer,
    );
    private readonly campaignBlock: StoredMapU256 = new StoredMapU256(this.campaignBlockPointer);

    public constructor() {
        super();
    }

    // -----------------------------------------------------------------------
    // execute router (overrides OP_NET.execute)
    // -----------------------------------------------------------------------
    public override execute(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            case this.createCampaignSelector:
                return this.createCampaign(calldata);
            case this.getCampaignSelector:
                return this.getCampaign(calldata);
            case this.getCampaignCountSelector:
                return this.getCampaignCount(calldata);
            default:
                return super.execute(method, calldata);
        }
    }

    // -----------------------------------------------------------------------
    // createCampaign
    // Creator must approve this contract to spend totalAmount of token first.
    // Per-call limit is capped by Bitcoin transaction witness data size.
    // At 64 bytes/recipient, 200 recipients ≈ 13 KB witness → safe for all miners.
    // The frontend handles client-side batching for lists larger than BATCH_SIZE.
    // The contract enforces a generous per-call cap of 5000 entries to prevent
    // malformed oversized calldata; realistic single-tx limit is ~200.
    // -----------------------------------------------------------------------
    @method(
        { name: 'token', type: ABIDataTypes.ADDRESS },
        { name: 'entries', type: ABIDataTypes.ADDRESS_UINT256_TUPLE },
    )
    @returns({ name: 'campaignId', type: ABIDataTypes.UINT256 })
    @emit('CampaignCreated')
    private createCampaign(calldata: Calldata): BytesWriter {
        const token = calldata.readAddress();
        const count = calldata.readU32();

        if (count === 0 || count > 5000) {
            throw new Revert('Recipient count must be 1-5000 per call');
        }

        // Read entries and accumulate total
        const recipients: Address[] = new Array<Address>(count as i32);
        const amounts: u256[] = new Array<u256>(count as i32);
        let totalAmount = u256.Zero;

        for (let i: u32 = 0; i < count; i++) {
            recipients[i as i32] = calldata.readAddress();
            amounts[i as i32] = calldata.readU256();
            totalAmount = SafeMath.add(totalAmount, amounts[i as i32]);
        }

        if (u256.eq(totalAmount, u256.Zero)) {
            throw new Revert('Total amount must be > 0');
        }

        // Assign campaign ID (read then increment)
        const campaignId = this.campaignCount.value;
        this.campaignCount.value = SafeMath.add(campaignId, u256.One);

        // Store campaign metadata
        const creator = Blockchain.tx.sender;
        // Address extends Uint8Array (32 bytes) — convert directly to u256 for map key
        this.campaignCreator.set(campaignId, u256.fromUint8ArrayBE(creator));
        this.campaignToken.set(campaignId, u256.fromUint8ArrayBE(token));
        this.campaignTotal.set(campaignId, totalAmount);
        this.campaignRecipientCount.set(campaignId, u256.fromU32(count));
        this.campaignBlock.set(campaignId, u256.fromU64(Blockchain.block.number));

        // Pull total from creator via transferFrom
        this.callTransferFrom(token, creator, totalAmount);

        // Distribute to each recipient
        for (let i: i32 = 0; i < count as i32; i++) {
            this.callTransfer(token, recipients[i], amounts[i]);
        }

        // Emit event
        const event = new CampaignCreated(campaignId, creator, token, totalAmount, count);
        this.emitEvent(event);

        const writer = new BytesWriter(32);
        writer.writeU256(campaignId);
        return writer;
    }

    // -----------------------------------------------------------------------
    // getCampaign
    // -----------------------------------------------------------------------
    @method({ name: 'campaignId', type: ABIDataTypes.UINT256 })
    @returns(
        { name: 'creator', type: ABIDataTypes.BYTES32 },
        { name: 'token', type: ABIDataTypes.BYTES32 },
        { name: 'totalAmount', type: ABIDataTypes.UINT256 },
        { name: 'recipientCount', type: ABIDataTypes.UINT32 },
        { name: 'blockHeight', type: ABIDataTypes.UINT256 },
    )
    @view
    private getCampaign(calldata: Calldata): BytesWriter {
        const campaignId = calldata.readU256();

        const totalCampaigns = this.campaignCount.value;
        if (u256.ge(campaignId, totalCampaigns)) {
            throw new Revert('Campaign does not exist');
        }

        const creatorU256 = this.campaignCreator.get(campaignId);
        const tokenU256 = this.campaignToken.get(campaignId);
        const totalAmount = this.campaignTotal.get(campaignId);
        const recipientCount = this.campaignRecipientCount.get(campaignId);
        const blockHeight = this.campaignBlock.get(campaignId);

        // bytes32(32) + bytes32(32) + u256(32) + u32(4) + u256(32) = 132 bytes
        const writer = new BytesWriter(132);
        writer.writeU256(creatorU256);
        writer.writeU256(tokenU256);
        writer.writeU256(totalAmount);
        writer.writeU32(recipientCount.lo0 as u32);
        writer.writeU256(blockHeight);
        return writer;
    }

    // -----------------------------------------------------------------------
    // getCampaignCount
    // -----------------------------------------------------------------------
    @returns({ name: 'count', type: ABIDataTypes.UINT256 })
    @view
    private getCampaignCount(_calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.campaignCount.value);
        return writer;
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private callTransferFrom(token: Address, from: Address, amount: u256): void {
        // transferFrom(address from, address to, uint256 amount)
        // 4 (selector) + 32 (from) + 32 (to=contract) + 32 (amount) = 100 bytes
        const writer = new BytesWriter(100);
        writer.writeSelector(this.transferFromSelector);
        writer.writeAddress(from);
        writer.writeAddress(Blockchain.contractAddress);
        writer.writeU256(amount);

        const result = Blockchain.call(token, writer);
        if (result.data.byteLength > 0) {
            if (!result.data.readBoolean()) {
                throw new Revert('transferFrom failed — check OP20 approval');
            }
        }
    }

    private callTransfer(token: Address, to: Address, amount: u256): void {
        // transfer(address to, uint256 amount)
        // 4 (selector) + 32 (to) + 32 (amount) = 68 bytes
        const writer = new BytesWriter(68);
        writer.writeSelector(this.transferSelector);
        writer.writeAddress(to);
        writer.writeU256(amount);

        const result = Blockchain.call(token, writer);
        if (result.data.byteLength > 0) {
            if (!result.data.readBoolean()) {
                throw new Revert('OP20 transfer failed');
            }
        }
    }
}
