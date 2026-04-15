import { rpcCall } from './rpc.js';
import type { PeerInfo, MiningInfo } from '$lib/types/index.js';

export async function getPeerInfo(): Promise<PeerInfo[]> {
  return rpcCall<PeerInfo[]>('getpeerinfo');
}

export async function getMiningInfo(): Promise<MiningInfo> {
  return rpcCall<MiningInfo>('getmininginfo');
}

export async function getNetworkHashPs(
  blocks: number = 120,
  height: number = -1,
): Promise<number> {
  return rpcCall<number>('getnetworkhashps', [blocks, height]);
}

export async function getNetworkSolPs(
  blocks: number = 120,
  height: number = -1,
): Promise<number> {
  return rpcCall<number>('getnetworksolps', [blocks, height]);
}
