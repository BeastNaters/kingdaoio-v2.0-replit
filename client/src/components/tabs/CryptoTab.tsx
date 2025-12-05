import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Lightbulb, TrendingUp, Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { PortfolioChart } from "@/components/PortfolioChart";
import { PerformanceChart } from "@/components/PerformanceChart";
import { DcaPerformanceChart } from "@/components/DcaPerformanceChart";
import { DataTable } from "@/components/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import type { TreasurySnapshot } from "@shared/treasury-types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CryptoTabProps {
  snapshot?: TreasurySnapshot;
  isLoadingSnapshot: boolean;
  historicalSnapshots?: TreasurySnapshot[];
  isLoadingHistory: boolean;
}

interface DcaToken {
  token: string;
  amount: number;
  priceUsd: number;
  usdValue: number;
}

interface DcaResponse {
  success: boolean;
  data: {
    tokens: DcaToken[];
    totalValueUsd: number;
  };
}

interface OtherToken {
  token: string;
  chain: string;
  amount: number;
  priceUsd: number;
  usdValue: number;
}

interface OtherTokensResponse {
  success: boolean;
  data: {
    tokens: OtherToken[];
    totalValueUsd: number;
  };
}

interface HistoryDataPoint {
  date: string;
  value: number;
  rawDate: string;
}

interface HistoryResponse {
  success: boolean;
  data: HistoryDataPoint[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function CryptoTab({ snapshot, isLoadingSnapshot, historicalSnapshots, isLoadingHistory }: CryptoTabProps) {
  const { data: dcaData, isLoading: isLoadingDca, isFetching: isFetchingDca, error: dcaError } = useQuery<DcaResponse>({
    queryKey: ['/api/sheets/dca'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: otherTokensData, isLoading: isLoadingOther, isFetching: isFetchingOther, error: otherTokensError } = useQuery<OtherTokensResponse>({
    queryKey: ['/api/sheets/tokens'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: treasuryHistoryData, isLoading: isLoadingTreasuryHistory } = useQuery<HistoryResponse>({
    queryKey: ['/api/sheets/treasury-history'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: dcaHistoryData, isLoading: isLoadingDcaHistory } = useQuery<HistoryResponse>({
    queryKey: ['/api/sheets/dca-history'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/dca'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/tokens'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/treasury-history'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sheets/dca-history'] });
  };

  const isRefreshing = isFetchingDca || isFetchingOther;

  const treasuryPerformanceData = treasuryHistoryData?.data || [];
  const dcaPerformanceData = dcaHistoryData?.data || [];

  const totalCryptoValue = snapshot?.tokens?.reduce((sum, token) => sum + (token.usdValue || 0), 0) || 0;
  
  const dcaTokens = dcaData?.data?.tokens || [];
  const dcaTotalValue = dcaData?.data?.totalValueUsd || 0;
  
  const otherTokens = otherTokensData?.data?.tokens || [];
  const otherTokensTotal = otherTokensData?.data?.totalValueUsd || 0;

  const dcaChartData = dcaTokens.map(item => ({
    name: item.token,
    value: item.usdValue,
  }));

  const dcaAllocations = dcaTokens.map(token => {
    const percentage = dcaTotalValue > 0 ? (token.usdValue / dcaTotalValue) * 100 : 0;
    return {
      symbol: token.token,
      amount: token.amount,
      usdValue: token.usdValue,
      percentage,
    };
  });

  const otherAllocations = otherTokens.map(token => {
    const percentage = otherTokensTotal > 0 ? (token.usdValue / otherTokensTotal) * 100 : 0;
    return {
      symbol: token.token,
      chain: token.chain,
      amount: token.amount,
      usdValue: token.usdValue,
      percentage,
    };
  });

  return (
    <div className="space-y-6" data-testid="tab-crypto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-2">Crypto Holdings</h2>
          <p className="text-muted-foreground">
            Cryptocurrency and token holdings across all DAO wallets.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          data-testid="button-refresh-crypto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Total Crypto Holdings
          </CardTitle>
          <CardDescription>
            Combined value of all cryptocurrency assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingSnapshot ? (
              <Skeleton className="h-16 rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-heading">
                  ${totalCryptoValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">USD</span>
              </div>
            )}
            <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <strong>Data Sources:</strong> Aggregating token balances from:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 ml-2 space-y-1">
                  <li>Gnosis Safe multi-sig wallets</li>
                  <li>DAO treasury wallets</li>
                  <li>Tactical operation wallets</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoadingSnapshot ? (
          <>
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </>
        ) : (
          <>
            <PortfolioChart tokens={snapshot?.tokens || []} />
            <DataTable tokens={(snapshot?.tokens || []).slice(0, 10)} title="Top Token Holdings" />
          </>
        )}
      </div>

      <div>
        {isLoadingTreasuryHistory ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <PerformanceChart data={treasuryPerformanceData} />
        )}
      </div>

      {/* DCA Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold font-heading" data-testid="heading-dca-portfolio">DCA Portfolio</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Dollar-Cost Averaging strategy holdings
        </p>

        <Card className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Total DCA Portfolio Value
            </CardTitle>
            <CardDescription>
              Combined value of all DCA positions ({dcaTokens.length} tokens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingDca ? (
                <Skeleton className="h-16 rounded" />
              ) : dcaError ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Failed to load DCA data from spreadsheet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The DCA_Portfolio sheet may not exist or be accessible. Please ensure the spreadsheet is properly configured.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-heading" data-testid="value-dca-total">
                    ${dcaTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">USD</span>
                </div>
              )}
              {!dcaError && (
                <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
                  <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Data Source:</strong> Values are pulled from the DCA_Portfolio sheet in the Treasury Spreadsheet.
                    Update the spreadsheet to reflect current holdings and prices.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!dcaError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DCA Allocation Chart */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>DCA Portfolio Allocation</CardTitle>
              <CardDescription>Distribution by USD value</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDca ? (
                <Skeleton className="h-80 rounded" />
              ) : dcaChartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No DCA holdings in spreadsheet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={dcaChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dcaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* DCA Holdings Table */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>DCA Holdings</CardTitle>
              <CardDescription>Token amounts and values</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDca ? (
                <Skeleton className="h-80 rounded" />
              ) : dcaAllocations.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No DCA holdings in spreadsheet
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div>Token</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">USD Value</div>
                    <div className="text-right">% Portfolio</div>
                  </div>
                  {dcaAllocations.map((token, index) => (
                    <div key={token.symbol} className="grid grid-cols-4 gap-2 text-sm" data-testid={`dca-token-${index}`}>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-right text-muted-foreground">{token.amount.toLocaleString()}</div>
                      <div className="text-right">${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      <div className="text-right text-muted-foreground">{token.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* DCA Performance Chart */}
        <DcaPerformanceChart data={dcaPerformanceData} isLoading={isLoadingDcaHistory} />
      </div>

      {/* Other Treasury Tokens Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold font-heading" data-testid="heading-other-tokens">Other Treasury Tokens</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Additional token holdings outside DCA portfolio
        </p>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Total Other Tokens Value
            </CardTitle>
            <CardDescription>
              Combined value of non-DCA token positions ({otherTokens.length} tokens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingOther ? (
                <Skeleton className="h-16 rounded" />
              ) : otherTokensError ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Failed to load Other Tokens data from spreadsheet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The Other_Tokens sheet may not exist or be accessible. Please ensure the spreadsheet is properly configured.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-heading" data-testid="value-other-tokens-total">
                    ${otherTokensTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">USD</span>
                </div>
              )}
              {!otherTokensError && (
                <div className="p-4 rounded-lg bg-muted/30 border border-muted flex gap-3">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Data Source:</strong> Values are pulled from the Other_Tokens sheet in the Treasury Spreadsheet.
                    Update the spreadsheet to reflect current holdings and prices.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!otherTokensError && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Token Holdings</CardTitle>
            <CardDescription>Other treasury token positions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOther ? (
              <Skeleton className="h-80 rounded" />
            ) : otherAllocations.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                No other tokens in spreadsheet
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div>Token</div>
                  <div>Chain</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">USD Value</div>
                  <div className="text-right">% of Total</div>
                </div>
                {otherAllocations.map((token, index) => (
                  <div key={`${token.symbol}-${token.chain}`} className="grid grid-cols-5 gap-2 text-sm" data-testid={`other-token-${index}`}>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-muted-foreground">{token.chain}</div>
                    <div className="text-right text-muted-foreground">{token.amount.toLocaleString()}</div>
                    <div className="text-right">${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-right text-muted-foreground">{token.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>

    </div>
  );
}
