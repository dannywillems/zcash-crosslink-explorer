import type { RpcResponse } from '$lib/types/index.js';
import { rpcActivityStart, rpcActivityEnd } from '$lib/stores/rpcActivity.js';

let rpcEndpoint = '';

export function setEndpoint(url: string): void {
  rpcEndpoint = url;
}

export function getEndpoint(): string {
  return rpcEndpoint;
}

let requestId = 0;

const RPC_TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('RPC timeout (>10s)');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function rpcCall<T>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint not configured');
  }

  requestId += 1;
  const id = requestId;
  const activityId = rpcActivityStart(method);

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params,
  });

  try {
    const response = await fetchWithTimeout(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const msg = `RPC HTTP error: ${response.status} ` + response.statusText;
      rpcActivityEnd(activityId, 'error', msg);
      throw new Error(msg);
    }

    const data: RpcResponse<T> = await response.json();

    if (data.error) {
      const msg = `RPC error ${data.error.code}: ` + data.error.message;
      rpcActivityEnd(activityId, 'error', msg);
      throw new Error(msg);
    }

    rpcActivityEnd(activityId, 'ok');
    return data.result as T;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    rpcActivityEnd(activityId, 'error', msg);
    throw e;
  }
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

  const response = await fetchWithTimeout(rpcEndpoint, {
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
