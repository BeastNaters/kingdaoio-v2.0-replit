import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Lightbulb, AlertCircle, RefreshCw } from "lucide-react";
import { WalletCard } from "@/components/WalletCard";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface DaoWalletFromSheets {
  label: string;
  address: string;
  chain: string;
  usdValue: number;
}

interface DaoWalletsResponse {
  success: boolean;
  data: {
    wallets: DaoWalletFromSheets[];
    totalValueUsd: number;
  };
}

export function DaoWalletsTab() {
  const { data, isLoading, error, isFetching } = useQuery<DaoWalletsResponse>({
    queryKey: ['/api/sheets/dao-wallets'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/dao-wallets'] });
  };

  const wallets = data?.data?.wallets || [];
  const totalValue = data?.data?.totalValueUsd || 0;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="tab-dao-wallets-loading">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Wallets</h2>
          <p className="text-muted-foreground">
            Primary DAO-controlled wallets (Controller, Deployer, and Developer wallets).
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Total DAO Wallet Value
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
      <div className="space-y-6" data-testid="tab-dao-wallets-error">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Wallets</h2>
          <p className="text-muted-foreground">
            Primary DAO-controlled wallets (Controller, Deployer, and Developer wallets).
          </p>
        </div>
        <Card className="rounded-2xl border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Failed to load DAO wallets</p>
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
      <div className="space-y-6" data-testid="tab-dao-wallets-empty">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Wallets</h2>
          <p className="text-muted-foreground">
            Primary DAO-controlled wallets (Controller, Deployer, and Developer wallets).
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No DAO wallets configured in spreadsheet</p>
              <p className="text-sm mt-2">Add wallets to the DAO_Wallets sheet to display them here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tab-dao-wallets">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">DAO Wallets</h2>
          <p className="text-muted-foreground">
            Primary DAO-controlled wallets (Controller, Deployer, and Developer wallets).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          data-testid="button-refresh-dao-wallets"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Total DAO Wallet Value
          </CardTitle>
          <CardDescription>
            Combined value across {wallets.length} controller and operational wallet{wallets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading" data-testid="value-dao-wallets-total">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-muted-foreground">USD</span>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong>Data Source:</strong> Values are pulled from the DAO_Wallets sheet in the Treasury Spreadsheet. 
                Update the spreadsheet to reflect current wallet balances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {wallets.map((wallet, idx) => (
          <div key={wallet.address || idx} className="space-y-3">
            {wallet.chain === 'SOL' && (
              <div className="p-3 rounded bg-accent/5 border border-accent/20 flex gap-2">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Solana Wallet:</strong> Balance is manually entered in the spreadsheet.
                </p>
              </div>
            )}
            <WalletCard
              label={wallet.label}
              address={wallet.address}
              chain={wallet.chain}
              balance={`$${wallet.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              balanceUsd={wallet.usdValue}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
