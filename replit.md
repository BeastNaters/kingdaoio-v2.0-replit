# KingDAO Treasury Dashboard

## Overview

The KingDAO Treasury Dashboard is a token-gated Web3 application providing Kong NFT holders with real-time visibility into the DAO's financial treasury, governance activities, and community announcements. It aggregates data from various sources (Gnosis Safe, Dune Analytics, Google Sheets, on-chain RPC) to display comprehensive treasury assets, portfolio allocation, DAO-owned NFT holdings, community governance proposals, and Discord announcements. The platform features a modern, dark-themed glassmorphic interface, offering a sophisticated and user-friendly experience for DAO members.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
Built with React 18+, TypeScript, and Vite, the frontend uses a component-based SPA architecture with Wouter for routing. UI components are styled with shadcn/ui (Radix UI primitives) and Tailwind CSS, adhering to a dark glassmorphic design. State management primarily uses TanStack Query for server state and caching, with React context/hooks for local state. Data visualization is handled by Recharts. Wallet connection is managed by Wagmi v2 and Viem for type-safe Ethereum interactions. Token gating is implemented client-side using `useReadContract` to verify Kong NFT ownership.

### Backend Architecture
The backend is an Express.js REST API with Node.js and TypeScript, acting as a proxy and aggregator for external services. It centralizes API key management, performs data normalization, and mitigates CORS issues. Key integrations include Gnosis Safe API, Dune Analytics, Google Sheets, Snapshot Hub, and Discord. Environment variable validation is performed at server startup to ensure all required configurations are present. Security hardening includes server-side admin authentication with wallet signature verification, timestamp-based signatures to prevent replay attacks, and error message sanitization.

### Database & Caching
The primary database uses PostgreSQL via Neon's serverless driver and Drizzle ORM. Supabase provides an additional PostgreSQL instance for treasury snapshot caching. Frontend caching is handled by React Query with configurable staleTime and refetchIntervals.

### Authentication & Authorization
Access control is primarily token-gating, verifying Kong NFT ownership via blockchain reads on both client and server. Admin authentication uses server-side wallet signature verification with timestamp-based checks.

### System Design
The dashboard features a tabbed interface for NFT Collections, Crypto, Multi-Sig, DAO Wallets, and Tactical Wallets. The NFT Collections tab displays DAO-owned NFTs with aggregated holdings and floor price tracking. The Crypto tab presents total crypto holdings, portfolio distribution, and historical performance charts (Treasury History and DCA History) using data from Google Sheets. DAO wallet structures are defined, categorizing controller, multi-sig, and tactical wallets, supporting both Ethereum and Solana addresses. A real-time community chat feature with channel-based messaging, rate limiting, and Kong NFT holder verification is also included.

## External Dependencies

- **Ethereum RPC:** Configurable RPC endpoint for Ethereum mainnet.
- **Dune Analytics:** Used for querying NFT floor prices.
- **Safe{Core} Transaction Service API:** For multi-sig wallet data, transaction tracking, and confirmations across multiple chains.
- **Google Sheets API:** For integrating manual treasury entries and historical data.
- **Snapshot GraphQL API:** For fetching DAO governance proposals.
- **Discord API:** For fetching community announcements.
- **Supabase:** Provides PostgreSQL database services for data persistence and caching.
- **Replit Connectors:** Manages OAuth and authentication for integrations like Google Sheets and Discord.
- **Solana RPC:** For Solana wallet balance tracking.
- **Web3 APIs (e.g., CoinGecko, Moralis, Alchemy):** For real-time token prices, wallet balances, and NFT metadata.

## Priority List

1. *(Open for next task)*
2. **Transition to Supabase** - Migrate database from current PostgreSQL/Neon to Supabase for enhanced features (dashboard, real-time subscriptions, row-level security)

## Admin Configuration

- **Admin Wallet:** `0xd8a7113A701A4ECcC5F8Aa85a621Ac42104D6Eb8`
- **Export Endpoints:** `/api/admin/export/messages` and `/api/admin/export/members` (supports `?format=csv`)