import { AirdropRegistry } from './AirdropRegistry.js';
import { Blockchain } from '@btc-vision/btc-runtime/runtime';

Blockchain.contract = () => new AirdropRegistry();

export { AirdropRegistry };
