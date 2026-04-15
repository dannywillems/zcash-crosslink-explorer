import { rpcCall } from './rpc.js';
import type { RawTransaction, MempoolInfo } from '$lib/types/index.js';

export async function getRawTransaction(
  txid: string,
  verbose: number = 1,
): Promise<RawTransaction> {
  return rpcCall<RawTransaction>('getrawtransaction', [txid, verbose]);
}

export async function getMempoolInfo(): Promise<MempoolInfo> {
  return rpcCall<MempoolInfo>('getmempoolinfo');
}

export async function getRawMempool(
  verbose: boolean = false,
): Promise<string[] | Record<string, unknown>> {
  return rpcCall<string[] | Record<string, unknown>>('getrawmempool', [
    verbose,
  ]);
}

export async function getAddressTxIds(addresses: string[]): Promise<string[]> {
  return rpcCall<string[]>('getaddresstxids', [{ addresses }]);
}
