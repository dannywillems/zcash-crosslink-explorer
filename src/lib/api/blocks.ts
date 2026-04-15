import { rpcCall } from './rpc.js';
import type { Block, BlockchainInfo } from '$lib/types/index.js';

export async function getBlockchainInfo(): Promise<BlockchainInfo> {
  return rpcCall<BlockchainInfo>('getblockchaininfo');
}

export async function getBlockCount(): Promise<number> {
  return rpcCall<number>('getblockcount');
}

export async function getBestBlockHash(): Promise<string> {
  return rpcCall<string>('getbestblockhash');
}

export async function getBlockHash(height: number): Promise<string> {
  return rpcCall<string>('getblockhash', [height]);
}

export async function getBlock(
  hashOrHeight: string | number,
  verbosity: number = 1,
): Promise<Block> {
  let hash: string;
  if (typeof hashOrHeight === 'number') {
    hash = await getBlockHash(hashOrHeight);
  } else {
    hash = hashOrHeight;
  }
  return rpcCall<Block>('getblock', [hash, verbosity]);
}

export async function getBlockRange(
  startHeight: number,
  count: number,
): Promise<Block[]> {
  const blocks: Block[] = [];
  const promises: Promise<Block>[] = [];

  for (let i = 0; i < count; i++) {
    const h = startHeight - i;
    if (h < 0) break;
    promises.push(getBlock(h));
  }

  const results = await Promise.allSettled(promises);
  for (const r of results) {
    if (r.status === 'fulfilled') {
      blocks.push(r.value);
    }
  }

  return blocks.sort((a, b) => b.height - a.height);
}

export async function getDifficulty(): Promise<number> {
  return rpcCall<number>('getdifficulty');
}
