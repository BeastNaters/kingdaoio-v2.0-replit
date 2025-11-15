import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Hash, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import type { SafeAccount } from '@shared/schema';

export function SafeManager() {
  const [selectedSafe, setSelectedSafe] = useState<SafeAccount | null>(null);

  const { data: accounts, isLoading, error } = useQuery<{ success: boolean; data: SafeAccount[] }>({
    queryKey: ['/api/safe/accounts'],
    queryFn: async () => {
      const response = await fetch('/api/safe/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch Safe accounts');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load Safe accounts. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const safeAccounts = accounts?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Safe Wallet Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage multi-signature Safe wallets and transactions
          </p>
        </div>
      </div>

      {safeAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No Safe accounts configured</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Configure your Safe wallet address in the environment variables to get started with multi-sig transactions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeAccounts.map((safe) => (
            <Card 
              key={safe.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedSafe(safe)}
              data-testid={`card-safe-${safe.safeAddress}`}
            >
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm">
                      {safe.safeAddress.slice(0, 6)}...{safe.safeAddress.slice(-4)}
                    </span>
                  </CardTitle>
                  <Badge variant="outline">
                    Chain {safe.chainId}
                  </Badge>
                </div>
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{safe.owners.length} owners</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{safe.threshold}/{safe.owners.length} threshold</span>
                  </div>
                  {safe.version && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4" />
                      <span>Version {safe.version}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {safe.owners.slice(0, 3).map((owner, index) => (
                    <Badge key={index} variant="secondary" className="font-mono text-xs">
                      {owner.slice(0, 6)}...{owner.slice(-4)}
                    </Badge>
                  ))}
                  {safe.owners.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{safe.owners.length - 3} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(safe.updatedAt).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://app.safe.global/home?safe=eth:${safe.safeAddress}`, '_blank');
                    }}
                    data-testid={`button-view-safe-${safe.safeAddress}`}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Safe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSafe && (
        <SafeDetails 
          safe={selectedSafe} 
          onClose={() => setSelectedSafe(null)} 
        />
      )}
    </div>
  );
}

function SafeDetails({ safe, onClose }: { safe: SafeAccount; onClose: () => void }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <CardTitle>Safe Details</CardTitle>
          <Button size="sm" variant="outline" onClick={onClose} data-testid="button-close-details">
            Close
          </Button>
        </div>
        <CardDescription>
          Complete information for {safe.safeAddress}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Safe Address</label>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {safe.safeAddress}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Chain ID</label>
            <p className="text-sm text-muted-foreground">{safe.chainId}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Threshold</label>
            <p className="text-sm text-muted-foreground">
              {safe.threshold} of {safe.owners.length} owners required
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Version</label>
            <p className="text-sm text-muted-foreground">{safe.version || 'Unknown'}</p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Owners ({safe.owners.length})</label>
          <div className="space-y-2">
            {safe.owners.map((owner, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-md bg-muted"
              >
                <span className="text-sm font-mono">{owner}</span>
                <Badge variant="outline">Owner {index + 1}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
