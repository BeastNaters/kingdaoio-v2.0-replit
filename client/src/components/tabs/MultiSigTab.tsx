import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SafeWallet {
  walletId: string;
  walletName: string;
  walletDescription: string;
  address: string;
  chainId: number;
  balances: Array<{
    symbol: string;
    name: string;
    amount: number;
    usdValue: number;
  }>;
  totalUsdValue: number;
  error: string | null;
}

interface AllWalletsResponse {
  wallets: SafeWallet[];
  totalUsdValue: number;
  walletsCount: number;
}

export function MultiSigTab() {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: AllWalletsResponse; message?: string }>({
    queryKey: ['/api/safe/all-wallets'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const walletsData = data?.data?.wallets || [];
  const totalValue = data?.data?.totalUsdValue || 0;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="tab-multisig-loading">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">Multi-Sig Wallets</h2>
          <p className="text-muted-foreground">
            Gnosis Safe multi-signature wallets controlled by the DAO.
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Total Multi-Sig Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-48" />
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" data-testid="tab-multisig-error">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">Multi-Sig Wallets</h2>
          <p className="text-muted-foreground">
            Gnosis Safe multi-signature wallets controlled by the DAO.
          </p>
        </div>
        <Card className="rounded-2xl border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Failed to load Safe wallets</p>
                <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (walletsData.length === 0) {
    return (
      <div className="space-y-6" data-testid="tab-multisig-empty">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">Multi-Sig Wallets</h2>
          <p className="text-muted-foreground">
            Gnosis Safe multi-signature wallets controlled by the DAO.
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No Safe wallet addresses configured</p>
              <p className="text-sm mt-2">Configure SAFE_DAO_FUND_ADDRESS_ETH, SAFE_REWARD_WALLET_ADDRESS, or SAFE_DCAP_WALLET_ADDRESS</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tab-multisig">
      <div>
        <h2 className="text-2xl font-bold font-heading mb-2">Multi-Sig Wallets</h2>
        <p className="text-muted-foreground">
          Gnosis Safe multi-signature wallets controlled by the DAO.
        </p>
      </div>

      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Total Multi-Sig Value
          </CardTitle>
          <CardDescription>
            Combined value across {walletsData.length} Gnosis Safe wallet{walletsData.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading" data-testid="value-multisig-total">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-muted-foreground">USD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {walletsData.map((wallet) => (
          <Card key={wallet.address} className="rounded-xl" data-testid={`wallet-card-${wallet.walletId}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{wallet.walletName}</CardTitle>
                  <CardDescription className="mt-1">{wallet.walletDescription}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-heading" data-testid={`balance-${wallet.walletId}`}>
                    ${wallet.totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {wallet.balances.length} token{wallet.balances.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <a 
                    href={`https://etherscan.io/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs hover:text-primary transition-colors"
                    data-testid={`address-${wallet.walletId}`}
                  >
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </a>
                </div>
                {wallet.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-sm text-destructive">
                    Error: {wallet.error}
                  </div>
                )}
                {!wallet.error && wallet.balances.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <div className="text-sm text-muted-foreground mb-2">Top Holdings:</div>
                    {wallet.balances.slice(0, 3).map((token, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1">
                        <span className="font-medium">{token.symbol}</span>
                        <div className="text-right">
                          <div className="font-medium">${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-xs text-muted-foreground">{token.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.symbol}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
