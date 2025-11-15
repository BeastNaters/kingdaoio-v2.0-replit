import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, ExternalLink, FileText, Loader2, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { SafeTransactionWithConfirmations } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PendingTransactionsProps {
  safeAddress: string;
  chainId?: number;
}

export function PendingTransactions({ safeAddress, chainId = 1 }: PendingTransactionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTx, setSelectedTx] = useState<SafeTransactionWithConfirmations | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: SafeTransactionWithConfirmations[] }>({
    queryKey: ['/api/safe/transactions', safeAddress],
    queryFn: async () => {
      const response = await fetch(`/api/safe/transactions/${safeAddress}?pending=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
      }
      return response.json();
    },
  });

  const signMutation = useMutation({
    mutationFn: async (safeTxHash: string) => {
      return await apiRequest('/api/safe/sign-transaction', {
        method: 'POST',
        body: JSON.stringify({
          safeAddress,
          safeTxHash,
          chainId,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Transaction Signed',
        description: 'Your signature has been added to the transaction',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/safe/transactions', safeAddress] });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to sign transaction',
        variant: 'destructive',
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (safeTxHash: string) => {
      return await apiRequest('/api/safe/execute-transaction', {
        method: 'POST',
        body: JSON.stringify({
          safeAddress,
          safeTxHash,
          chainId,
        }),
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Transaction Executed',
        description: `Hash: ${response.data.transactionHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/safe/transactions', safeAddress] });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to execute transaction',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Failed to load pending transactions. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.data || [];

  return (
    <>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Transactions
          </CardTitle>
          <CardDescription>
            Transactions awaiting confirmations from {safeAddress.slice(0, 6)}...{safeAddress.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending transactions</p>
              <p className="text-sm text-muted-foreground mt-2">
                All transactions have been executed or there are no proposals yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onSign={() => signMutation.mutate(tx.safeTxHash)}
                  onExecute={() => executeMutation.mutate(tx.safeTxHash)}
                  onViewDetails={() => setSelectedTx(tx)}
                  isSigning={signMutation.isPending}
                  isExecuting={executeMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTx && (
        <TransactionDetailsDialog
          transaction={selectedTx}
          open={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  );
}

function TransactionCard({
  transaction,
  onSign,
  onExecute,
  onViewDetails,
  isSigning,
  isExecuting,
}: {
  transaction: SafeTransactionWithConfirmations;
  onSign: () => void;
  onExecute: () => void;
  onViewDetails: () => void;
  isSigning: boolean;
  isExecuting: boolean;
}) {
  const canExecute = transaction.confirmationsCount >= transaction.confirmationsRequired;

  return (
    <Card className="hover-elevate" data-testid={`card-transaction-${transaction.safeTxHash}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">
                  {transaction.description || 'Safe Transaction'}
                </h3>
                <Badge variant={canExecute ? "default" : "secondary"}>
                  {canExecute ? 'Ready to Execute' : 'Awaiting Signatures'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{transaction.safeTxHash.slice(0, 10)}...</span>
                <span>•</span>
                <span>Nonce: {transaction.nonce}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <p className="text-sm font-mono">
                {transaction.to.slice(0, 10)}...{transaction.to.slice(-8)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Value</label>
              <p className="text-sm">
                {parseFloat(transaction.value) / 1e18} ETH
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Confirmations</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${(transaction.confirmationsCount / transaction.confirmationsRequired) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium">
                {transaction.confirmationsCount}/{transaction.confirmationsRequired}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              data-testid={`button-view-details-${transaction.safeTxHash}`}
            >
              <FileText className="h-3 w-3 mr-1" />
              Details
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onSign}
              disabled={isSigning || canExecute}
              data-testid={`button-sign-${transaction.safeTxHash}`}
            >
              {isSigning && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Sign
            </Button>

            {canExecute && (
              <Button
                size="sm"
                onClick={onExecute}
                disabled={isExecuting}
                data-testid={`button-execute-${transaction.safeTxHash}`}
              >
                {isExecuting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                <ArrowRight className="h-3 w-3 mr-1" />
                Execute
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Created {new Date(transaction.createdAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDetailsDialog({
  transaction,
  open,
  onClose,
}: {
  transaction: SafeTransactionWithConfirmations;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Complete information for transaction {transaction.safeTxHash.slice(0, 10)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Safe TX Hash</label>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {transaction.safeTxHash}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Badge>{transaction.status}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium">To Address</label>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {transaction.to}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Value</label>
              <p className="text-sm text-muted-foreground">
                {parseFloat(transaction.value) / 1e18} ETH
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Nonce</label>
              <p className="text-sm text-muted-foreground">{transaction.nonce}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Operation</label>
              <p className="text-sm text-muted-foreground">
                {transaction.operation === 0 ? 'Call' : 'DelegateCall'}
              </p>
            </div>
          </div>

          {transaction.description && (
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.description}
              </p>
            </div>
          )}

          {transaction.data && transaction.data !== '0x' && (
            <div>
              <label className="text-sm font-medium">Transaction Data</label>
              <pre className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded-md overflow-x-auto">
                {transaction.data}
              </pre>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Confirmations ({transaction.confirmations.length})
            </label>
            {transaction.confirmations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmations yet</p>
            ) : (
              <div className="space-y-2">
                {transaction.confirmations.map((confirmation, index) => (
                  <div
                    key={confirmation.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <span className="text-sm font-mono">{confirmation.owner}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Signed</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(confirmation.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-xs text-muted-foreground">
              Created by {transaction.createdBy.slice(0, 10)}...
            </span>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
