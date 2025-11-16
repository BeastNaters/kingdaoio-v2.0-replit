# KingDAO Treasury Dashboard

## Overview

The KingDAO Treasury Dashboard is a token-gated Web3 application designed for Kong NFT holders. Its primary purpose is to provide exclusive, real-time visibility into the DAO's financial treasury, governance activities, and community announcements. The platform aggregates data from various sources (Gnosis Safe, Dune Analytics, Google Sheets, on-chain RPC) to display comprehensive treasury assets, portfolio allocation, DAO-owned NFT holdings, community governance proposals from Snapshot, and Discord announcements. The dashboard features a modern, dark-themed glassmorphic interface, drawing inspiration from leading DeFi platforms, to offer a sophisticated and user-friendly experience for DAO members.

## Recent Changes (November 2025)

### Kong NFT Holdings Tracker (November 16, 2025)
- **Live blockchain queries**: Created `kongNftService` to query Kong NFT (ERC-721) balances across all DAO wallets using eth_call
- **Multi-wallet aggregation**: Calculates total KONG NFTs held by combining balances from all Safe multi-sig wallets (DAO Fund, Rewards, DCAP, Incentivization Bucket), multisig wallets, plus Controller ETH wallet
- **Comprehensive wallet coverage**: Queries Safe wallets (env-configured), multisig wallets from daoWallets, and controller ETH wallet with automatic deduplication
- **INCENTIVE wallet integration**: Added Incentivization Bucket Wallet (0x00239b99703b773B0A1B6A33f4691867aF071d5A) to holdings calculation
- **Floor price integration**: Integrated Dune Analytics for live Kong NFT floor price tracking via `GET /api/kong-nfts/floor-price` endpoint
- **Dune Analytics floor price query**: Created `fetchKongNftFloorPrice()` function to query NFT floor prices from Dune (falls back to 0.050 ETH if not configured)
- **Dynamic floor price display**: Frontend fetches live floor price from Dune with 15-minute refresh interval; shows data source (Dune vs static)
- **New API endpoint**: `GET /api/kong-nfts/total-dao-holdings` returns aggregated Kong NFT holdings with per-wallet breakdown
- **NFT Collections tab enhancement**: Added prominent Kong NFT Holdings card displaying live total, Dune-sourced floor price, and expandable wallet-by-wallet breakdown
- **Error resilience**: Individual wallet query failures don't break aggregation; errors shown per-wallet with zero balance fallback
- **Address deduplication**: Case-insensitive deduplication prevents duplicate counting when same address appears in multiple wallet sources
- **Contract verification**: Uses Kong NFT contract address from environment variable (VITE_BETTING_KONGS_TOKEN_CONTRACT_ADDRESS: 0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328)
- **React Query integration**: Frontend caches Kong NFT data for 5 minutes with automatic 10-minute refetch interval
- **Future enhancement**: Floor price currently static (0.050 ETH as of Nov 2025); plan to integrate OpenSea/Reservoir API for dynamic pricing

### Safe Global Core API Integration (November 15, 2025)
- **Full Safe Transaction Service integration**: Implemented complete Safe{Core} API following official documentation at https://docs.safe.global/core-api/api-overview
- **Read-only Safe operations**: Configured SafeService with direct REST API calls to Safe Transaction Service endpoints for viewing wallet holdings and transaction history
- **Available endpoints**:
  - `GET /api/safe/info/:address` - Fetch Safe account details (owners, threshold, version, modules)
  - `GET /api/safe/balances/:safeAddress` - Get Safe balances with USD values from Safe Transaction Service
  - `GET /api/safe/transactions/pending/:safeAddress` - List unexecuted multisig transactions
  - `GET /api/safe/transactions/history/:safeAddress` - Get executed transaction history with confirmations
  - `GET /api/safe/transaction/:safeTxHash` - Fetch specific transaction details
  - `GET /api/safe/confirmations/:safeTxHash` - Get transaction signatures and confirmations
  - `GET /api/safe/safes-by-owner/:ownerAddress` - List all Safe accounts owned by an address
- **Multi-chain support**: Safe Transaction Service endpoints for 13 networks (Mainnet, Goerli, Sepolia, Optimism, Gnosis, Polygon, BNB, Arbitrum, Base, Avalanche, Celo, Polygon zkEVM, zkSync Era)
- **Native token accuracy**: Correct native token metadata per chain (ETH, MATIC, BNB, AVAX, xDAI, CELO) for accurate balance display
- **Error handling**: All Safe API methods properly throw errors for proper HTTP error responses instead of silent failures
- **TypeScript types**: Comprehensive interfaces for SafeInfo, SafeBalance, SafeMultisigTransaction, SafeConfirmation from Safe API responses
- **Write operations disabled**: Transaction proposal, signing, and execution endpoints return 501 responses directing users to Safe web interface
- **Landing page redesign**: Custom cover page using Kong NFT banner image with centered welcome card overlay
- **Branding update**: Replaced navbar "K" text with official King DAO emblem image

### Community Chat Feature
- **Real-time messaging**: Implemented Socket.IO-based community chat with three channels (general, treasury, governance)
- **Database-enforced rate limiting**: Window-based (30-second) rate limiting per wallet per channel using PostgreSQL unique constraints
- **Kong NFT holder verification**: Messages validated against Kong NFT ownership before posting
- **Schema validation**: Zod validation on all message inputs before database insertion
- **Message ordering**: ASC ordering (oldest first) for proper chat scroll behavior
- **Community page**: Full chat UI with channel tabs, message history, and real-time updates

### Documentation Suite
- **DEV_INTEGRATION_ROADMAP.md**: Phased integration plan (Phase 1: Core, Phase 2: Analytics, Phase 3: Community, Phase 4: Advanced)
- **.env.example**: Comprehensive environment variable reference with descriptions and examples
- **INTEGRATION_GUIDE.md**: Step-by-step setup instructions for all external integrations (RPC, Gnosis Safe, Dune, Moralis, Supabase, Sheets, Discord)
- **SECURITY.md**: Security best practices covering threat model, secrets management, authentication, database security, API security, rate limiting, error handling, and incident response

### Environment Validation
- **server/validateEnv.ts**: Comprehensive environment variable validation at server startup
- **Required variables**: DATABASE_URL, ETHEREUM_RPC_URL (or NEXT_PUBLIC_RPC_URL), ADMIN_ADDRESSES
- **Optional validation**: Supabase config, API keys (Dune, Moralis), Google Sheets ID, Safe URLs, snapshot intervals
- **Startup protection**: Server exits with clear error messages if required variables missing or invalid
- **Address validation**: Admin addresses validated using isValidEthAddress before server starts

### Security Hardening
- **Server-side admin authentication**: Created POST `/api/auth/is-admin` endpoint with wallet signature verification. Admin addresses no longer exposed in client bundle (VITE_ADMIN_ADDRESSES removed).
- **Timestamp-based signatures**: Client generates timestamp, signs message, server validates within ±5 minute window to prevent replay attacks
- **Custom admin verification hook**: `useAdminStatus` handles signature requests, caching (4-minute staleTime), and comprehensive error states (loading, cancellation, network failures, access denial).
- **Error message sanitization**: Implemented `createErrorResponse` utility to prevent stack trace leakage in production. All 15+ API routes updated to use sanitized error responses.
- **Address validators**: Created `server/lib/validators.ts` with EVM and Solana address validation functions (isValidEthAddress, isValidSolAddress, isValidAddress, detectAddressChain).

### Architecture Improvements
- **Centralized shared exports**: `shared/index.ts` barrel file consolidates types, constants, and data for cleaner imports across frontend and backend.
- **Chain metadata**: Expanded `shared/constants.ts` with CHAIN_IDS, EXPLORERS, and SUPPORTED_CHAINS. Added chainId to all wallet objects for explorer link generation.
- **Reusable WalletCard component**: Created `client/src/components/WalletCard.tsx` to eliminate ~200 lines of duplication across Multi-Sig, DAO Wallets, and Tactical tabs.
- **Centralized mock data**: `shared/mockData.ts` consolidates all mock wallet balances for easy API integration in the future.
- **React Query caching**: Dashboard queries now use staleTime (1-5 minutes) and refetchInterval (5-10 minutes) for better performance and reduced API calls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+ and TypeScript using Vite, featuring a component-based SPA architecture with Wouter for client-side routing. UI components are styled with shadcn/ui (Radix UI primitives) and Tailwind CSS, adhering to a dark glassmorphic design with purple/cyan gradients and custom fonts (Inter, Space Grotesk). State management primarily uses TanStack Query for server state and caching, with React context/hooks for local state. Data visualization is handled by Recharts, offering responsive charts for portfolio and performance tracking.

### Web3 Integration
Wallet connection is managed by Wagmi v2 and Viem for type-safe Ethereum interactions, including WalletConnect and injected wallet support. Token gating is implemented client-side using `useReadContract` to verify Kong NFT ownership (ERC721 contract: `0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328`), with a server-side endpoint `/api/auth/holdings` for additional validation. This ensures access is restricted to Kong NFT holders.

### Backend Architecture
The backend is an Express.js REST API developed with Node.js and TypeScript. It acts as a proxy and aggregator for various external services, centralizing API key management, performing data normalization, and mitigating CORS issues. Key integrations include Gnosis Safe API for multi-sig wallet balances, Dune Analytics for blockchain analytics (specifically for NFT floor prices), Google Sheets for manual treasury entries, Snapshot Hub for governance proposals, Discord for announcements, and Supabase for caching treasury snapshots.

### Database & Caching
The primary database utilizes PostgreSQL via Neon's serverless driver and Drizzle ORM for type-safe operations. Supabase provides an additional PostgreSQL instance for treasury snapshot caching, enhancing data persistence and reducing external API calls. Frontend caching is handled by React Query.

### Authentication & Authorization
The primary access control is token-gating, verifying NFT ownership via blockchain reads on both client and server. The system is designed for a Web3-native authentication model, where Kong NFT ownership serves as the authorization ticket, with future plans for Sign-in with Ethereum (SIWE).

### System Design
The dashboard features a tabbed interface for organizing treasury data into categories: NFT Collections, Crypto, Multi-Sig, DAO Wallets, and Tactical Wallets. The NFT Collections tab displays DAO-owned NFTs with links and token details. The Crypto tab presents total crypto holdings, portfolio distribution, and performance charts, including dedicated sections for DCA and other treasury tokens. DAO wallet structures are defined, categorizing controller, multi-sig, and tactical wallets, including support for Ethereum and Solana addresses.

## External Dependencies

- **Ethereum RPC:** Configurable RPC endpoint for Ethereum mainnet (e.g., Infura, Alchemy).
- **Dune Analytics:** Used exclusively for querying blockchain analytics data, specifically NFT floor prices (e.g., KING NFT).
- **Safe{Core} Transaction Service API:** Official Safe Global infrastructure for multi-sig wallet data, transaction tracking, and confirmations. Documentation: https://docs.safe.global/core-api/transaction-service-overview
- **Google Sheets API:** For integrating manual treasury entries.
- **Snapshot GraphQL API:** For fetching DAO governance proposals.
- **Discord API:** For fetching community announcements.
- **Supabase:** Provides PostgreSQL database services for data persistence and caching.
- **Replit Connectors:** Manages OAuth and authentication for integrations like Google Sheets and Discord.
- **Solana RPC:** (e.g., Helius/QuickNode) for Solana wallet balance tracking.
- **Web3 APIs (e.g., CoinGecko, Moralis, Alchemy):** For real-time token prices, wallet balances, and NFT metadata.