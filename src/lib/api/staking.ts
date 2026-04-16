import { rpcCall } from './rpc.js';
import type { StakingRosterEntry, FinalityInfo } from '$lib/types/index.js';

export async function getTflRosterZec(): Promise<StakingRosterEntry[]> {
  return rpcCall<StakingRosterEntry[]>('get_tfl_roster_zec');
}

export async function getTflFinalBlockHash(): Promise<string> {
  return rpcCall<string>('get_tfl_final_block_hash');
}

export async function getTflFinalBlockHeightAndHash(): Promise<FinalityInfo> {
  return rpcCall<FinalityInfo>('get_tfl_final_block_height_and_hash');
}

export async function getTflBlockFinalityFromHash(
  hash: string,
): Promise<unknown> {
  return rpcCall<unknown>('get_tfl_block_finality_from_hash', [hash]);
}

export async function getTflTxFinalityFromHash(hash: string): Promise<unknown> {
  return rpcCall<unknown>('get_tfl_tx_finality_from_hash', [hash]);
}

export async function getTflFatPointerToBftChainTip(): Promise<unknown> {
  return rpcCall<unknown>('get_tfl_fat_pointer_to_bft_chain_tip');
}

export interface RosterMember {
  pub_key?: string;
  voting_power?: number;
  txids?: { txid?: string; zats?: number }[];
}

export async function getTflRosterZats(): Promise<RosterMember[]> {
  return rpcCall<RosterMember[]>('get_tfl_roster_zats');
}

export async function getBondInfo(bondKey: string): Promise<unknown> {
  return rpcCall<unknown>('getbondinfo', [bondKey]);
}
