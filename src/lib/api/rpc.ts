import type { RpcResponse } from '$lib/types/index.js';

let rpcEndpoint = '';

export function setEndpoint(url: string): void {
  rpcEndpoint = url;
}

export function getEndpoint(): string {
  return rpcEndpoint;
}

let requestId = 0;

export async function rpcCall<T>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint not configured');
  }

  requestId += 1;
  const id = requestId;

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params,
  });

  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `RPC HTTP error: ${response.status} ${response.statusText}`,
    );
  }

  const data: RpcResponse<T> = await response.json();

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return data.result as T;
}

export interface RpcLog {
  method: string;
  params: unknown[];
  result: unknown;
}

const rpcLogs: RpcLog[] = [];
let logEnabled = false;

export function enableRpcLogging(on: boolean): void {
  logEnabled = on;
  if (!on) rpcLogs.length = 0;
}

export function getRpcLogs(): RpcLog[] {
  return rpcLogs;
}

export function clearRpcLogs(): void {
  rpcLogs.length = 0;
}

export async function rpcCallRaw(
  method: string,
  params: unknown[] = [],
): Promise<unknown> {
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint not configured');
  }

  requestId += 1;
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    method,
    params,
  });

  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `RPC HTTP error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (logEnabled) {
    rpcLogs.push({ method, params, result: data });
  }

  return data;
}
