# Zcash Crosslink Explorer

Block explorer for the
[Zcash Crosslink](https://github.com/nicksarona/zebra-crosslink) PoS testnet. A
static single-page application that connects to any Zcash Crosslink node via
JSON-RPC.

**Live:** https://dannywillems.github.io/zcash-crosslink-explorer/

## Features

- **Dashboard** with network stats (height, difficulty, hash rate, finality,
  peers) and recent blocks
- **Block explorer** with paginated list and full block detail (transactions,
  merkle root, previous/next navigation)
- **Transaction viewer** with inputs, outputs, ZEC amounts, and confirmation
  status
- **Mempool browser** showing pending transactions and pool size
- **Staking & finality** page with validator roster, voting power distribution,
  and finality gap tracking
- **Analytics** with average block time, tx/block stats, and block size chart
- **Search** by block height, block hash, or transaction hash
- **Custom node endpoint** input to connect to any running Crosslink node
- **Dark/light theme** with system preference detection

## Getting started

```bash
# Install dependencies
make setup

# Run dev server
make dev

# Build for production
make build

# Preview production build
make preview
```

## Connect to a node

The explorer is a static client-side app. It needs a running Zcash Crosslink
node with JSON-RPC enabled and CORS headers allowing browser requests.

Enter the node URL (e.g. `http://localhost:8232`) in the header input and click
Connect.

### CORS configuration

If connecting from a browser to a local node, the node must serve appropriate
CORS headers. You can use a reverse proxy like [caddy](https://caddyserver.com/)
or nginx to add CORS headers.

## Docker

```bash
# Build image
make docker-build

# Run container
make docker-run
```

The container serves the static site on port 8080 using nginx.

Docker images are published to `ghcr.io/dannywillems/zcash-crosslink-explorer`
on every tagged release.

## Tech stack

- [SvelteKit](https://svelte.dev/) with
  [adapter-static](https://svelte.dev/docs/kit/adapter-static)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/) (strict mode)

## RPC methods used

| Method                                | Page                         |
| ------------------------------------- | ---------------------------- |
| `getblockchaininfo`                   | Dashboard, Blocks, Analytics |
| `getblock` / `getblockhash`           | Block detail, Recent blocks  |
| `getblockcount`                       | Blocks pagination            |
| `getrawtransaction`                   | Transaction detail           |
| `getrawmempool` / `getmempoolinfo`    | Transactions (mempool)       |
| `getpeerinfo`                         | Dashboard, Analytics         |
| `getmininginfo`                       | Dashboard                    |
| `getnetworkhashps` / `getdifficulty`  | Analytics                    |
| `get_tfl_roster_zec`                  | Staking                      |
| `get_tfl_final_block_height_and_hash` | Dashboard, Staking           |

## License

MIT
