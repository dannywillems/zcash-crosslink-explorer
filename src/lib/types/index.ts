export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  verificationprogress: number;
  chainwork: string;
  pruned: boolean;
  estimatedheight: number;
  upgrades?: Record<string, unknown>;
  consensus?: Record<string, unknown>;
}

export interface Block {
  hash: string;
  confirmations: number;
  size: number;
  height: number;
  version: number;
  merkleroot: string;
  tx: string[];
  time: number;
  nonce: string;
  bits: string;
  difficulty: number;
  chainwork: string;
  anchor: string;
  previousblockhash?: string;
  nextblockhash?: string;
}

export interface RawTransaction {
  hex?: string;
  txid: string;
  version: number;
  locktime: number;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  blockhash?: string;
  confirmations?: number;
  time?: number;
  blocktime?: number;
  size?: number;
}

export interface TransactionInput {
  txid?: string;
  vout?: number;
  scriptSig?: {
    asm: string;
    hex: string;
  };
  coinbase?: string;
  sequence: number;
}

export interface TransactionOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
  };
}

export interface MempoolInfo {
  size: number;
  bytes: number;
  usage: number;
}

export interface PeerInfo {
  id?: number;
  addr?: string;
  addrlocal?: string;
  services?: string;
  lastsend?: number;
  lastrecv?: number;
  conntime?: number;
  timeoffset?: number;
  pingtime?: number;
  version?: number;
  subver?: string;
  inbound?: boolean;
  startingheight?: number;
  banscore?: number;
  synced_headers?: number;
  synced_blocks?: number;
}

export interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  connections: number;
}

export interface AddressBalance {
  balance: number;
  received: number;
}

export interface AddressUtxo {
  address: string;
  txid: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  height: number;
}

export interface StakingRosterEntry {
  public_key?: string;
  voting_power?: number;
  txid?: string;
}

export interface FinalityInfo {
  hash: string;
  height: number;
}

export interface MiningInfo {
  blocks: number;
  currentblocksize: number;
  currentblocktx: number;
  difficulty: number;
  errors: string;
  networkhashps: number;
  pooledtx: number;
  chain: string;
}

export interface RpcError {
  code: number;
  message: string;
}

export interface RpcResponse<T> {
  result: T | null;
  error: RpcError | null;
  id: string | number;
}
