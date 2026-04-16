<script lang="ts">
  import { base } from '$app/paths';
  import { connected } from '$lib/stores/endpoint.js';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import {
    getBlockchainInfo,
    getBlockRange,
    getBlock,
  } from '$lib/api/blocks.js';
  import {
    getTflFinalBlockHeightAndHash,
    getTflFatPointerToBftChainTip,
    getTflBlockFinalityFromHash,
  } from '$lib/api/staking.js';
  import { truncateHash } from '$lib/utils/format.js';
  import type { Block, FinalityInfo } from '$lib/types/index.js';

  // Layout constants
  const NODE_RADIUS = 8;
  const ROW_HEIGHT = 100;
  const POW_X = 350;
  const BFT_X = 650;
  const HEADER_Y = 60;

  interface PowNode {
    block: Block;
    x: number;
    y: number;
    finalized: boolean;
  }

  interface BftNode {
    height: number;
    hash: string;
    x: number;
    y: number;
    pointsAtBcHash?: string;
  }

  interface CrossLink {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: 'pow-to-bft' | 'bft-to-pow';
  }

  let powNodes = $state<PowNode[]>([]);
  let bftNodes = $state<BftNode[]>([]);
  let crossLinks = $state<CrossLink[]>([]);
  let finalityInfo = $state<FinalityInfo | null>(null);
  let bftTip = $state<unknown>(null);
  let tipHeight = $state(0);
  let bftTipHeight = $state(0);
  let loading = $state(false);
  let error = $state('');
  let svgHeight = $state(800);
  let hoveredNode = $state<string | null>(null);

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v && !loading) load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      const [chainInfo, finality, fatPtr] = await Promise.all([
        getBlockchainInfo(),
        getTflFinalBlockHeightAndHash().catch(() => null),
        getTflFatPointerToBftChainTip().catch(() => null),
      ]);

      tipHeight = chainInfo.blocks;
      finalityInfo = finality;
      bftTip = fatPtr;

      // Parse BFT tip height from fat pointer if available
      if (fatPtr && typeof fatPtr === 'object' && fatPtr !== null) {
        const fp = fatPtr as Record<string, unknown>;
        if (typeof fp.height === 'number') {
          bftTipHeight = fp.height;
        } else if (typeof fp.bft_height === 'number') {
          bftTipHeight = fp.bft_height;
        }
      }

      // Fetch PoW blocks
      const blockCount = Math.min(15, tipHeight + 1);
      const blocks = await getBlockRange(tipHeight, blockCount);

      // Check finality for each block
      const finalizedHeight = finality?.height ?? 0;

      // Build PoW nodes
      const sorted = [...blocks].sort((a, b) => b.height - a.height);
      powNodes = sorted.map((block, i) => ({
        block,
        x: POW_X,
        y: HEADER_Y + 40 + i * ROW_HEIGHT,
        finalized: block.height <= finalizedHeight,
      }));

      svgHeight = HEADER_Y + 40 + sorted.length * ROW_HEIGHT + 40;

      // Try to get block finality details for cross-links
      await buildCrossLinks(sorted, finalizedHeight);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }

  async function buildCrossLinks(
    blocks: Block[],
    finalizedHeight: number,
  ): Promise<void> {
    const links: CrossLink[] = [];
    const bftMap = new Map<number, BftNode>();

    // Try to get finality info for each block to discover
    // BFT block references
    const results = await Promise.allSettled(
      blocks.map(b => getTflBlockFinalityFromHash(b.hash)),
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status !== 'fulfilled' || !r.value) continue;

      const info = r.value as Record<string, unknown>;
      // Extract BFT height if present
      if (typeof info.bft_height === 'number') {
        const bftH = info.bft_height;
        if (!bftMap.has(bftH)) {
          bftMap.set(bftH, {
            height: bftH,
            hash:
              typeof info.bft_hash === 'string' ? info.bft_hash : `bft-${bftH}`,
            x: BFT_X,
            y: 0, // computed later
            pointsAtBcHash: blocks[i].hash,
          });
        }

        // BFT -> PoW link
        const powNode = powNodes[i];
        if (powNode) {
          links.push({
            fromX: BFT_X,
            fromY: 0, // placeholder
            toX: powNode.x,
            toY: powNode.y,
            type: 'bft-to-pow',
          });
        }
      }
    }

    // If we have BFT tip info, add at least the tip node
    if (bftTipHeight > 0 && !bftMap.has(bftTipHeight)) {
      bftMap.set(bftTipHeight, {
        height: bftTipHeight,
        hash: 'tip',
        x: BFT_X,
        y: 0,
      });
    }

    // If we have finality info, ensure the finalizing BFT
    // block is shown
    if (finalityInfo && finalityInfo.height > 0 && bftMap.size === 0) {
      // Create synthetic BFT nodes based on what we know
      const maxBft = bftTipHeight || 1;
      for (let h = Math.max(1, maxBft - 4); h <= maxBft; h++) {
        bftMap.set(h, {
          height: h,
          hash: `bft-${h}`,
          x: BFT_X,
          y: 0,
        });
      }
    }

    // Layout BFT nodes
    const bftArr = [...bftMap.values()].sort((a, b) => b.height - a.height);
    const bftStartY = HEADER_Y + 40 + ROW_HEIGHT * 0.5;
    bftArr.forEach((node, i) => {
      node.y = bftStartY + i * ROW_HEIGHT * 1.5;
    });
    bftNodes = bftArr;

    // Rebuild links with correct Y positions
    crossLinks = [];
    for (const bft of bftArr) {
      if (bft.pointsAtBcHash) {
        const pow = powNodes.find(p => p.block.hash === bft.pointsAtBcHash);
        if (pow) {
          crossLinks.push({
            fromX: bft.x,
            fromY: bft.y,
            toX: pow.x,
            toY: pow.y,
            type: 'bft-to-pow',
          });
        }
      }
    }

    // Add PoW -> finalized BFT links for finalized blocks
    const finalBft = bftArr[bftArr.length - 1];
    if (finalBft) {
      for (const pow of powNodes) {
        if (pow.finalized && pow.block.height >= finalizedHeight - 2) {
          crossLinks.push({
            fromX: pow.x,
            fromY: pow.y,
            toX: finalBft.x,
            toY: finalBft.y,
            type: 'pow-to-bft',
          });
        }
      }
    }
  }

  function handleNodeClick(hash: string, type: 'block' | 'bft'): void {
    if (type === 'block') {
      window.location.href = `${base}/block/${hash}`;
    }
  }
</script>

{#if !isConnected}
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-8 text-center"
  >
    <p class="text-[var(--fg-muted)]">
      Connect to a node to view chain visualization
    </p>
  </div>
{:else if loading}
  <LoadingSpinner text="Loading chain data..." />
{:else if error}
  <ErrorMessage message={error} />
{:else}
  <!-- Stats overlay -->
  <div
    class="mb-4 rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-4"
  >
    <div
      class="grid grid-cols-2 gap-4 text-center
             text-sm md:grid-cols-4"
    >
      <div>
        <p class="text-xs text-[var(--fg-muted)]">PoW Height</p>
        <p class="text-lg font-bold tabular-nums">
          {tipHeight}
        </p>
      </div>
      <div>
        <p class="text-xs text-[var(--fg-muted)]">PoS Height</p>
        <p class="text-lg font-bold tabular-nums">
          {bftTipHeight || 'N/A'}
        </p>
      </div>
      <div>
        <p class="text-xs text-[var(--fg-muted)]">PoW Finalized</p>
        <p class="text-lg font-bold tabular-nums">
          {finalityInfo?.height ?? 'N/A'}
        </p>
      </div>
      <div>
        <p class="text-xs text-[var(--fg-muted)]">Finality Gap</p>
        <p class="text-lg font-bold tabular-nums">
          {finalityInfo ? tipHeight - finalityInfo.height : 'N/A'}
        </p>
      </div>
    </div>
  </div>

  <!-- Chain visualization -->
  <div
    class="overflow-auto rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)]"
  >
    <svg width="100%" viewBox="0 0 900 {svgHeight}" class="min-w-[700px]">
      <!-- Column labels -->
      <text
        x={POW_X}
        y="25"
        text-anchor="middle"
        class="fill-[var(--color-success)] text-sm font-bold"
        font-size="14"
      >
        PoW Chain (Best Chain)
      </text>
      <text
        x={BFT_X}
        y="25"
        text-anchor="middle"
        class="fill-[var(--color-danger)] text-sm font-bold"
        font-size="14"
      >
        PoS / BFT Chain
      </text>

      <!-- Vertical guide lines -->
      <line
        x1={POW_X}
        y1="40"
        x2={POW_X}
        y2={svgHeight - 20}
        stroke="var(--bd)"
        stroke-width="1"
        stroke-dasharray="4,4"
      />
      <line
        x1={BFT_X}
        y1="40"
        x2={BFT_X}
        y2={svgHeight - 20}
        stroke="var(--bd)"
        stroke-width="1"
        stroke-dasharray="4,4"
      />

      <!-- Cross-chain links -->
      {#each crossLinks as link}
        <path
          d="M {link.fromX} {link.fromY}
             C {(link.fromX + link.toX) / 2} {link.fromY},
               {(link.fromX + link.toX) / 2} {link.toY},
               {link.toX} {link.toY}"
          fill="none"
          stroke={link.type === 'bft-to-pow'
            ? 'var(--color-danger)'
            : 'var(--color-success)'}
          stroke-width="1.5"
          stroke-opacity="0.4"
        />
        <!-- Arrow head -->
        <circle
          cx={link.toX}
          cy={link.toY}
          r="3"
          fill={link.type === 'bft-to-pow'
            ? 'var(--color-danger)'
            : 'var(--color-success)'}
          fill-opacity="0.5"
        />
      {/each}

      <!-- PoW parent links -->
      {#each powNodes as node, i}
        {#if i < powNodes.length - 1}
          <line
            x1={node.x}
            y1={node.y + NODE_RADIUS}
            x2={powNodes[i + 1].x}
            y2={powNodes[i + 1].y - NODE_RADIUS}
            stroke="var(--color-success)"
            stroke-width="2"
            stroke-opacity="0.6"
          />
        {/if}
      {/each}

      <!-- BFT parent links -->
      {#each bftNodes as node, i}
        {#if i < bftNodes.length - 1}
          <line
            x1={node.x}
            y1={node.y + NODE_RADIUS}
            x2={bftNodes[i + 1].x}
            y2={bftNodes[i + 1].y - NODE_RADIUS}
            stroke="var(--color-danger)"
            stroke-width="2"
            stroke-opacity="0.6"
          />
        {/if}
      {/each}

      <!-- PoW block nodes -->
      {#each powNodes as node}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          class="cursor-pointer"
          onclick={() => handleNodeClick(node.block.hash, 'block')}
          onmouseenter={() => (hoveredNode = node.block.hash)}
          onmouseleave={() => (hoveredNode = null)}
        >
          <!-- Finalized glow -->
          {#if node.finalized}
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS + 4}
              fill="var(--color-success)"
              fill-opacity="0.15"
            />
          {/if}

          <!-- Node circle -->
          <circle
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            fill={node.finalized ? 'var(--color-success)' : 'var(--color-info)'}
            stroke={hoveredNode === node.block.hash
              ? 'var(--color-primary)'
              : 'none'}
            stroke-width="2"
          />

          <!-- Hash label (left) -->
          <text
            x={node.x - 18}
            y={node.y + 4}
            text-anchor="end"
            font-size="11"
            font-family="var(--font-mono)"
            fill="var(--fg-muted)"
          >
            {truncateHash(node.block.hash, 8, 8)}
          </text>

          <!-- Height label (right) -->
          <text
            x={node.x + 18}
            y={node.y + 4}
            text-anchor="start"
            font-size="12"
            font-weight="bold"
            fill="var(--fg)"
          >
            {node.block.height}
          </text>

          <!-- Tx count -->
          <text
            x={node.x + 18}
            y={node.y + 18}
            text-anchor="start"
            font-size="9"
            fill="var(--fg-muted)"
          >
            {node.block.tx.length} txs
          </text>

          <!-- Finalized badge -->
          {#if node.finalized}
            <text
              x={node.x - 18}
              y={node.y + 18}
              text-anchor="end"
              font-size="9"
              fill="var(--color-success)"
            >
              finalized
            </text>
          {/if}
        </g>
      {/each}

      <!-- BFT block nodes -->
      {#each bftNodes as node}
        <g>
          <circle
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS + 2}
            fill="var(--color-danger)"
            fill-opacity="0.8"
          />

          <!-- Height (left) -->
          <text
            x={node.x - 18}
            y={node.y + 4}
            text-anchor="end"
            font-size="12"
            font-weight="bold"
            fill="var(--color-danger)"
          >
            {node.height}
          </text>

          <!-- Hash (right) -->
          <text
            x={node.x + 18}
            y={node.y + 4}
            text-anchor="start"
            font-size="11"
            font-family="var(--font-mono)"
            fill="var(--fg-muted)"
          >
            {node.hash.length > 16 ? truncateHash(node.hash, 8, 8) : node.hash}
          </text>
        </g>
      {/each}

      <!-- Legend -->
      <g transform="translate(20, {svgHeight - 30})">
        <circle cx="0" cy="0" r="5" fill="var(--color-success)" />
        <text x="10" y="4" font-size="10" fill="var(--fg-muted)">
          PoW finalized
        </text>
        <circle cx="100" cy="0" r="5" fill="var(--color-info)" />
        <text x="110" y="4" font-size="10" fill="var(--fg-muted)">
          PoW unfinalized
        </text>
        <circle cx="220" cy="0" r="5" fill="var(--color-danger)" />
        <text x="230" y="4" font-size="10" fill="var(--fg-muted)">
          PoS/BFT block
        </text>
      </g>
    </svg>
  </div>

  <div class="mt-2 flex justify-center">
    <button
      onclick={load}
      class="rounded-md border border-[var(--bd)] px-4 py-2
             text-sm text-[var(--fg-muted)]
             hover:text-[var(--fg)] transition-colors"
    >
      Refresh
    </button>
  </div>
{/if}
