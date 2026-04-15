import { rpcCall } from './rpc.js';
import type { AddressBalance, AddressUtxo } from '$lib/types/index.js';

export async function getAddressBalance(
  addresses: string[],
): Promise<AddressBalance> {
  return rpcCall<AddressBalance>('getaddressbalance', [{ addresses }]);
}

export async function getAddressUtxos(
  addresses: string[],
): Promise<AddressUtxo[]> {
  return rpcCall<AddressUtxo[]>('getaddressutxos', [{ addresses }]);
}
