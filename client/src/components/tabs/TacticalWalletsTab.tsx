import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Lightbulb, AlertCircle, RefreshCw } from "lucide-react";
import { WalletCard } from "@/components/WalletCard";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface TacticalWalletFromSheets {
  label: string;
  address: string;
  chain: string;
  usdValue: number;
}

interface TacticalWalletsResponse {
  success: boolean;
  data: {
    wallets: TacticalWalletFromSheets[];
    totalValueUsd: number;
  };
}

export function TacticalWalletsTab() {
  const { data, isLoading, error, isFetching } = useQuery<TacticalWalletsResponse>({
    queryKey: ['/api/sheets/tactical'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/tactical'] });
  };

  const wallets = data?.data?.wallets || [];
  const totalValue = data?.data?.totalValueUsd || 0;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="tab-tactical-wallets-loading">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Tactical Wallets</h2>
          <p className="text-muted-foreground">
            These wallets are used for short-term mints, trades, and tactical operations.
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Total Tactical Wallet Value
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
      <div className="space-y-6" data-testid="tab-tactical-wallets-error">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Tactical Wallets</h2>
          <p className="text-muted-foreground">
            These wallets are used for short-term mints, trades, and tactical operations.
          </p>
        </div>
        <Card className="rounded-2xl border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Failed to load tactical wallets</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Could not fetch wallet data from Google Sheets'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="space-y-6" data-testid="tab-tactical-wallets-empty">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Tactical Wallets</h2>
          <p className="text-muted-foreground">
            These wallets are used for short-term mints, trades, and tactical operations.
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tactical wallets configured in spreadsheet</p>
              <p className="text-sm mt-2">Add wallets to the Tactical_Wallets sheet to display them here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tab-tactical-wallets">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Tactical Wallets</h2>
          <p className="text-muted-foreground">
            These wallets are used for short-term mints, trades, and tactical operations. Values may fluctuate.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          data-testid="button-refresh-tactical-wallets"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Total Tactical Wallet Value
          </CardTitle>
          <CardDescription>
            Combined value in {wallets.length} operational and trading wallet{wallets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading" data-testid="value-tactical-total">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-muted-foreground">USD</span>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong>Data Source:</strong> Values are pulled from the Tactical_Wallets sheet in the Treasury Spreadsheet.
                Update the spreadsheet to reflect current wallet balances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex gap-3">
        <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-accent">Volatile Wallets</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tactical wallets are used for short-term operations including NFT mints, DeFi trades, and strategic acquisitions. 
            Balances may change frequently and should be updated regularly in the spreadsheet.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {wallets.map((wallet, idx) => (
          <WalletCard
            key={wallet.address || idx}
            label={wallet.label}
            address={wallet.address}
            chain={wallet.chain}
            balance={`$${wallet.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            balanceUsd={wallet.usdValue}
          />
        ))}
      </div>
    </div>
  );
}
