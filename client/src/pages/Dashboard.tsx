import { useQuery } from "@tanstack/react-query";
import { Wallet, Coins, Image } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AlertBanner } from "@/components/AlertBanner";
import { ExportDialog } from "@/components/ExportDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreasuryWebSocket } from "@/hooks/useTreasuryWebSocket";
import { NftCollectionsTab } from "@/components/tabs/NftCollectionsTab";
import { CryptoTab } from "@/components/tabs/CryptoTab";
import { MultiSigTab } from "@/components/tabs/MultiSigTab";
import { DaoWalletsTab } from "@/components/tabs/DaoWalletsTab";
import { TacticalWalletsTab } from "@/components/tabs/TacticalWalletsTab";
import type { TreasurySnapshot } from "@shared/treasury-types";

export default function Dashboard() {
  useTreasuryWebSocket();
  const { data: snapshot, isLoading: isLoadingSnapshot, error: snapshotError } = useQuery<TreasurySnapshot>({
    queryKey: ['/api/treasury/snapshots'],
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: historicalSnapshots, isLoading: isLoadingHistory } = useQuery<TreasurySnapshot[]>({
    queryKey: ['/api/treasury/snapshots/history', { limit: 90 }],
    queryFn: async () => {
      const response = await fetch('/api/treasury/snapshots/history?limit=90');
      if (!response.ok) {
        throw new Error('Failed to fetch historical snapshots');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  if (snapshotError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlertBanner
          type="error"
          message="Failed to load treasury data. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="page-dashboard">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Treasury Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of KingDAO treasury assets</p>
        </div>
        <ExportDialog />
      </div>

      {isLoadingSnapshot ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Treasury Value"
            value={`$${(snapshot?.totalUsdValue || 0).toLocaleString()}`}
            subtitle="Across all sources"
            icon={Coins}
          />
          <StatCard
            title="Wallet Count"
            value={snapshot?.wallets?.length || 0}
            subtitle="Multi-sig wallets tracked"
            icon={Wallet}
          />
          <StatCard
            title="NFT Holdings"
            value={snapshot?.nfts?.length || 0}
            subtitle="Unique NFT assets"
            icon={Image}
          />
        </div>
      )}

      <Tabs defaultValue="nft-collections" className="space-y-6">
        <TabsList className="sticky top-0 z-50 bg-background py-2 grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="nft-collections" data-testid="tab-trigger-nft-collections">
            NFT Collections
          </TabsTrigger>
          <TabsTrigger value="crypto" data-testid="tab-trigger-crypto">
            Crypto
          </TabsTrigger>
          <TabsTrigger value="multisig" data-testid="tab-trigger-multisig">
            Multi-Sig
          </TabsTrigger>
          <TabsTrigger value="dao-wallets" data-testid="tab-trigger-dao-wallets">
            DAO Wallets
          </TabsTrigger>
          <TabsTrigger value="tactical" data-testid="tab-trigger-tactical">
            Tactical
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nft-collections" className="space-y-6">
          <NftCollectionsTab />
        </TabsContent>

        <TabsContent value="crypto" className="space-y-6">
          <CryptoTab 
            snapshot={snapshot}
            isLoadingSnapshot={isLoadingSnapshot}
            historicalSnapshots={historicalSnapshots}
            isLoadingHistory={isLoadingHistory}
          />
        </TabsContent>

        <TabsContent value="multisig" className="space-y-6">
          <MultiSigTab />
        </TabsContent>

        <TabsContent value="dao-wallets" className="space-y-6">
          <DaoWalletsTab />
        </TabsContent>

        <TabsContent value="tactical" className="space-y-6">
          <TacticalWalletsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// DEV INTEGRATION LOG
// ============================================================================
// This log tracks what still needs to be wired up for full treasury dashboard functionality.
// All tabs currently use mock/placeholder data for demonstration purposes.
//
// PRIORITY 1 - Token Price Integration:
// 1. Replace mock token prices in Crypto/DCA tab with real price API (CoinGecko, Moralis, Alchemy).
//    - Current: Mock prices in client/src/lib/pricing.ts
//    - Target: CoinGecko API: https://api.coingecko.com/api/v3/simple/price
//    - Alternative: Moralis Token Price API: https://docs.moralis.io/web3-data-api/evm/reference/get-token-price
//    - Alternative: 1inch Price Oracle: https://api.1inch.dev/price/v1.1/1
//
// PRIORITY 2 - Multi-Sig Wallet Balances:
// 2. For Multi-Sig tab: call Safe Transaction Service to get live USD balances.
//    - Current: Mock balances in MultiSigTab.tsx
//    - Target: https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/balances/usd/
//    - Wallets to query: DAO Fund, Reward Wallet, Incentivization Bucket (addresses in shared/daoWallets.ts)
//
// PRIORITY 3 - DAO Wallet Balances:
// 3. For DAO wallet balances: call on-chain RPC for ETH, and Solana RPC for the SOL controller.
//    - Current: Mock balances in DaoWalletsTab.tsx
//    - ETH wallets: Use ethers.js/viem + Alchemy/Moralis for token balances
//    - SOL wallet (Gok7zfZ2aZ6ftvYtXhRR2KR8dzu2cKZLDeqvDhNQvipT): Use Solana RPC / Helius / QuickNode
//    - Note: Solana integration requires separate client library and RPC endpoint
//
// PRIORITY 4 - Tactical Wallet Tracking:
// 4. For Tactical wallets: fetch per-wallet token/NFT balances via web3 APIs
//    - Current: Mock balances in TacticalWalletsTab.tsx
//    - Integration: Alchemy NFT API + Token API or Moralis equivalents
//    - Wallets: Dogepound & ZK Race, Wilder World (addresses in shared/daoWallets.ts)
//
// PRIORITY 5 - NFT Floor Price Data:
// 5. For NFT Collections: integrate Dune Analytics ONLY for KING NFT floor data (as requested).
//    - Current: Hardcoded collection data in shared/daoNfts.ts
//    - Target: Dune Analytics for KING floor price specifically
//    - Alternative: OpenSea API or Reservoir for Rollbots/Sports Rollbots floor prices
//    - Endpoint to create: /api/dune/nft-floors (returns floor prices for all collections)
//
// PRIORITY 6 - Data Persistence:
// 6. Move hardcoded wallet and NFT collection data into Supabase tables once schema is ready.
//    - Current: Data in shared/daoWallets.ts and shared/daoNfts.ts
//    - Target: Create Supabase tables for:
//      - dao_wallets (address, label, chain, wallet_type)
//      - nft_collections (contract_address, name, description, token_ids)
//    - Note: treasury_snapshots table also needs manual creation (SQL in CODEBASE_AUDIT.md)
//
// PRIORITY 7 - DCA Portfolio Performance:
// 7. Implement DCA Portfolio Performance tracking with historical price data
//    - Current: Placeholder component in CryptoTab.tsx
//    - Target: Store periodic snapshots of DCA holdings in Supabase
//    - Fetch historical prices from CoinGecko Historical API
//    - Calculate performance trends (cost basis vs current value)
//
// IMPORTANT NOTES:
// - DO NOT use Dune Analytics for general token prices, wallet balances, or multi-sig data
// - ONLY use Dune for NFT collection analytics (specifically KING NFT floor price)
// - Prefer Web3 APIs (RPC, Alchemy, Moralis, CoinGecko) for all other integrations
// - All mock data is clearly labeled in the UI with integration notes
// - Each tab component has detailed TODO comments at the top with integration guidance
//
// ============================================================================
