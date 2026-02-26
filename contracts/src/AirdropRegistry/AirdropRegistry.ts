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
    sha256,
} from '@btc-vision/btc-runtime/runtime';

// NOTE: @method, @returns, @emit, @final, and ABIDataTypes are compile-time
// globals from @btc-vision/opnet-transform. Do NOT import them.

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

class CampaignCreated extends NetEvent {
    public constructor(
        public readonly campaignId: u256,
        public readonly creator: Address,
        public readonly token: Address,
        public readonly totalAmount: u256,
        public readonly recipientCount: u32,
    ) {
        super('CampaignCreated');
    }

    protected override encodeData(writer: BytesWriter): void {
        writer.writeU256(this.campaignId);
        writer.writeAddress(this.creator);
        writer.writeAddress(this.token);
        writer.writeU256(this.totalAmount);
        writer.writeU32(this.recipientCount);
    }
}

// ---------------------------------------------------------------------------
// AirdropRegistry
// ---------------------------------------------------------------------------

@final
export class AirdropRegistry extends OP_NET {
    // -----------------------------------------------------------------------
    // Selectors — own methods
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
    // Storage pointers (all via Blockchain.nextPointer — never raw constants)
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
    private readonly campaignCount: StoredU256 = new StoredU256(
        this.campaignCountPointer,
        u256.Zero,
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
    // callMethod router
    // -----------------------------------------------------------------------
    public override callMethod(calldata: Calldata): BytesWriter {
        const selector = calldata.readSelector();
        switch (selector) {
            case this.createCampaignSelector:
                return this.createCampaign(calldata);
            case this.getCampaignSelector:
                return this.getCampaign(calldata);
            case this.getCampaignCountSelector:
                return this.getCampaignCount(calldata);
            default:
                return super.callMethod(calldata);
        }
    }

    // -----------------------------------------------------------------------
    // createCampaign
    // Creator must have approved this contract to spend totalAmount of token
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

        if (count === 0 || count > 50) {
            throw new Revert('Recipients must be 1-50');
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

        // Assign campaign ID
        const campaignId = this.campaignCount.get();
        this.campaignCount.set(SafeMath.add(campaignId, u256.One));

        // Store campaign metadata
        const creator = Blockchain.tx.sender;
        this.campaignCreator.set(campaignId, this.addressToU256(creator));
        this.campaignToken.set(campaignId, this.addressToU256(token));
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
        { name: 'creator', type: ABIDataTypes.ADDRESS },
        { name: 'token', type: ABIDataTypes.ADDRESS },
        { name: 'totalAmount', type: ABIDataTypes.UINT256 },
        { name: 'recipientCount', type: ABIDataTypes.UINT32 },
        { name: 'blockHeight', type: ABIDataTypes.UINT256 },
    )
    @view
    private getCampaign(calldata: Calldata): BytesWriter {
        const campaignId = calldata.readU256();

        const totalCampaigns = this.campaignCount.get();
        if (u256.ge(campaignId, totalCampaigns)) {
            throw new Revert('Campaign does not exist');
        }

        const creatorU256 = this.campaignCreator.get(campaignId);
        const tokenU256 = this.campaignToken.get(campaignId);
        const totalAmount = this.campaignTotal.get(campaignId);
        const recipientCount = this.campaignRecipientCount.get(campaignId);
        const blockHeight = this.campaignBlock.get(campaignId);

        // Writer: address(32) + address(32) + u256(32) + u32(4) + u256(32) = 132 bytes
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
        writer.writeU256(this.campaignCount.get());
        return writer;
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private callTransferFrom(token: Address, from: Address, amount: u256): void {
        // encode transferFrom(address from, address to, uint256 amount)
        // 4 (selector) + 32 (from) + 32 (to=contract) + 32 (amount) = 100 bytes
        const writer = new BytesWriter(100);
        writer.writeSelector(this.transferFromSelector);
        writer.writeAddress(from);
        writer.writeAddress(Blockchain.contract.address);
        writer.writeU256(amount);

        const result = Blockchain.call(token, writer, true);
        if (result.data.byteLength > 0) {
            if (!result.data.readBoolean()) {
                throw new Revert('transferFrom failed — check approval');
            }
        }
    }

    private callTransfer(token: Address, to: Address, amount: u256): void {
        // encode transfer(address to, uint256 amount)
        // 4 (selector) + 32 (to) + 32 (amount) = 68 bytes
        const writer = new BytesWriter(68);
        writer.writeSelector(this.transferSelector);
        writer.writeAddress(to);
        writer.writeU256(amount);

        const result = Blockchain.call(token, writer, true);
        if (result.data.byteLength > 0) {
            if (!result.data.readBoolean()) {
                throw new Revert('transfer failed');
            }
        }
    }

    private addressToU256(addr: Address): u256 {
        // Serialize address to bytes and hash to u256 for StoredMapU256 storage
        const writer = new BytesWriter(32);
        writer.writeAddress(addr);
        const bytes = sha256(writer.getBuffer());
        // Build u256 from 32 hash bytes (big-endian u64 chunks)
        const lo0: u64 =
            ((bytes[0] as u64) << 56) |
            ((bytes[1] as u64) << 48) |
            ((bytes[2] as u64) << 40) |
            ((bytes[3] as u64) << 32) |
            ((bytes[4] as u64) << 24) |
            ((bytes[5] as u64) << 16) |
            ((bytes[6] as u64) << 8) |
            (bytes[7] as u64);
        const lo1: u64 =
            ((bytes[8] as u64) << 56) |
            ((bytes[9] as u64) << 48) |
            ((bytes[10] as u64) << 40) |
            ((bytes[11] as u64) << 32) |
            ((bytes[12] as u64) << 24) |
            ((bytes[13] as u64) << 16) |
            ((bytes[14] as u64) << 8) |
            (bytes[15] as u64);
        const hi0: u64 =
            ((bytes[16] as u64) << 56) |
            ((bytes[17] as u64) << 48) |
            ((bytes[18] as u64) << 40) |
            ((bytes[19] as u64) << 32) |
            ((bytes[20] as u64) << 24) |
            ((bytes[21] as u64) << 16) |
            ((bytes[22] as u64) << 8) |
            (bytes[23] as u64);
        const hi1: u64 =
            ((bytes[24] as u64) << 56) |
            ((bytes[25] as u64) << 48) |
            ((bytes[26] as u64) << 40) |
            ((bytes[27] as u64) << 32) |
            ((bytes[28] as u64) << 24) |
            ((bytes[29] as u64) << 16) |
            ((bytes[30] as u64) << 8) |
            (bytes[31] as u64);
        return new u256(lo0, lo1, hi0, hi1);
    }
}
