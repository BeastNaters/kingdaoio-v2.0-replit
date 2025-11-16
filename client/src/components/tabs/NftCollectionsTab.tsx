// NOTE: For NFT collection valuation, it is OK to use Dune Analytics for floor price data for KING specifically.
// For all other data (token balances, multisigs, wallets), prefer Web3 APIs.
// 
// Dune Analytics integration for KING NFT floor price:
// - Query ID: Create a Dune query to fetch KING NFT floor price from OpenSea/Reservoir data
// - Update interval: Every 15-30 minutes to track floor price changes
// - Endpoint: /api/dune/nft-floors (returns floor prices for all collections)
//
// For Rollbots and Sports Rollbots floor prices:
// - Primary option: Use Dune Analytics for consistency
// - Alternative: OpenSea API or Reservoir API for real-time floor prices

import { ExternalLink, Copy, CheckCircle2, Lightbulb, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { daoNftCollections } from "@shared/daoNfts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface KongNftBalance {
  address: string;
  label: string;
  balance: number;
  walletType: 'safe' | 'controller';
  error: string | null;
}

interface TotalKongNftHoldings {
  totalBalance: number;
  wallets: KongNftBalance[];
  timestamp: string;
}

export function NftCollectionsTab() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch total Kong NFT holdings across all DAO wallets
  const { data: kongHoldings, isLoading: isLoadingKong, error: kongError } = useQuery({
    queryKey: ['/api/kong-nfts/total-dao-holdings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const totalNfts = daoNftCollections.reduce((sum, collection) => sum + collection.tokenIds.length, 0);

  return (
    <div className="space-y-6" data-testid="tab-nft-collections">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-2">DAO-Owned NFT Collections</h2>
        <p className="text-muted-foreground">
          These are collections held by the DAO. Values are estimated from floor price data.
        </p>
      </div>

      {/* Kong NFT Holdings Section */}
      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">Kong NFT Holdings</CardTitle>
          <CardDescription>
            Total KONG NFTs held across all DAO wallets (Safe multi-sigs + Controller wallet)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingKong ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : kongError ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                Failed to load Kong NFT holdings. Please try again later.
              </div>
            ) : kongHoldings?.success && kongHoldings?.data ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-heading" data-testid="text-kong-total">
                    {kongHoldings.data.totalBalance}
                  </span>
                  <span className="text-muted-foreground">KONG NFTs</span>
                </div>
                
                {/* Breakdown by wallet */}
                <details className="group">
                  <summary 
                    className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    data-testid="toggle-kong-breakdown"
                  >
                    <span>View breakdown by wallet ({kongHoldings.data.wallets.length} wallets)</span>
                    <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {kongHoldings.data.wallets.map((wallet) => (
                      <div
                        key={wallet.address}
                        className="p-3 rounded-lg bg-muted/20 border border-muted/30 flex justify-between items-center"
                        data-testid={`wallet-balance-${wallet.address}`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{wallet.label}</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {wallet.walletType === 'safe' ? 'Safe Multi-sig' : 'Controller'}
                            </Badge>
                          </div>
                          {wallet.error && (
                            <div className="text-xs text-destructive">{wallet.error}</div>
                          )}
                        </div>
                        <div className="text-xl font-bold font-heading">
                          {wallet.balance}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Live Data:</strong> Kong NFT balances are queried in real-time from the Ethereum blockchain 
                    using the Kong NFT contract (0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328).
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Other NFT Collections */}
      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">Other NFT Collections</CardTitle>
          <CardDescription>
            Additional NFT collections held by the DAO ({daoNftCollections.length} collections)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">{totalNfts}</span>
              <span className="text-muted-foreground">NFTs owned</span>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong>Integration Note:</strong> Connect to Dune Analytics floor price API 
                (<code className="text-xs bg-background/50 px-1 py-0.5 rounded">/api/dune/nft-floors</code>) 
                to calculate estimated USD value (floor price × quantity per collection).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {daoNftCollections.map((collection, idx) => (
          <Card 
            key={collection.contractAddress}
            className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl hover-elevate transition-all duration-200"
            data-testid={`collection-card-${idx}`}
          >
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{collection.name}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {collection.tokenIds.length} NFTs
                    </Badge>
                  </div>
                  <CardDescription>{collection.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {collection.links.opensea && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-opensea-${idx}`}
                    >
                      <a
                        href={collection.links.opensea}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        OpenSea
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid={`button-etherscan-${idx}`}
                  >
                    <a
                      href={collection.links.etherscan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Etherscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Contract:</span>
                  <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                    {shortenAddress(collection.contractAddress)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyAddress(collection.contractAddress)}
                    data-testid={`button-copy-${idx}`}
                  >
                    {copiedAddress === collection.contractAddress ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">NFTs Owned</div>
                      <div className="text-2xl font-bold font-heading">
                        {collection.tokenIds.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Est. Floor Value</div>
                      <div className="text-sm text-muted-foreground italic">
                        Connect to floor price API
                      </div>
                    </div>
                  </div>
                </div>

                <details className="group">
                  <summary 
                    className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    data-testid={`toggle-token-ids-${idx}`}
                  >
                    <span>View all {collection.tokenIds.length} token IDs</span>
                    <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-muted/30 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {collection.tokenIds.map((tokenId) => (
                        <Badge
                          key={tokenId}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          #{tokenId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Future Integration Points:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Dune Analytics:</strong> Query NFT floor prices by contract address
              </li>
              <li>
                <strong>Supabase:</strong> Load collection metadata and token IDs from database instead of hardcoding
              </li>
              <li>
                <strong>Moralis:</strong> Fetch real-time NFT metadata and images for each token
              </li>
              <li>
                <strong>OpenSea API:</strong> Get collection stats, volume, and sales data
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
