import { AirdropRegistry } from './AirdropRegistry';
import { Blockchain } from '@btc-vision/btc-runtime/runtime';

Blockchain.contract = () => new AirdropRegistry();

export { AirdropRegistry };
