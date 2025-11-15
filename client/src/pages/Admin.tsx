import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useWalletClient } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAdminAuthHeaders } from '@/lib/adminAuth';
import { Settings, Wallet, MessageSquare, Trash2, Plus, Shield } from 'lucide-react';
import { SafeManager } from '@/components/SafeManager';
import { TransactionProposal } from '@/components/TransactionProposal';
import { PendingTransactions } from '@/components/PendingTransactions';

interface AdminSetting {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

interface DiscordConfig {
  guildId?: string;
  channelId?: string;
  enabled: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const { data: walletClient } = useWalletClient();
  const [newWallet, setNewWallet] = useState('');
  const [authHeaders, setAuthHeaders] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    async function signAuth() {
      if (walletClient && !authHeaders) {
        try {
          const headers = await getAdminAuthHeaders(walletClient);
          setAuthHeaders(headers);
        } catch (error) {
          console.error('Failed to sign admin auth:', error);
          toast({
            title: 'Authentication Failed',
            description: 'Please sign the message to access admin functions',
            variant: 'destructive',
          });
        }
      }
    }
    signAuth();
  }, [walletClient, authHeaders, toast]);

  const { data: settings, isLoading, error } = useQuery<AdminSetting[]>({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      if (!authHeaders) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/admin/settings', {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    enabled: !!authHeaders,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!authHeaders) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update setting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Configuration has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const discordConfig = (settings?.find(s => s.key === 'discord_config')?.value as DiscordConfig) || { enabled: false };
  const treasuryWallets = (settings?.find(s => s.key === 'treasury_wallets')?.value as string[]) || [];

  const handleDiscordUpdate = (updates: Partial<DiscordConfig>) => {
    const newConfig = { ...discordConfig, ...updates };
    updateSettingMutation.mutate({
      key: 'discord_config',
      value: newConfig,
    });
  };

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddWallet = () => {
    const trimmedAddress = newWallet.trim();

    if (!trimmedAddress) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a wallet address',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidAddress(trimmedAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address (0x followed by 40 hex characters)',
        variant: 'destructive',
      });
      return;
    }

    const normalizedAddress = trimmedAddress.toLowerCase();

    if (treasuryWallets.includes(normalizedAddress)) {
      toast({
        title: 'Duplicate Wallet',
        description: 'This wallet is already in the list',
        variant: 'destructive',
      });
      return;
    }

    updateSettingMutation.mutate({
      key: 'treasury_wallets',
      value: [...treasuryWallets, normalizedAddress],
    });
    setNewWallet('');
  };

  const handleRemoveWallet = (address: string) => {
    updateSettingMutation.mutate({
      key: 'treasury_wallets',
      value: treasuryWallets.filter(w => w !== address),
    });
  };

  if (isLoading || !authHeaders) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="page-admin">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage DAO treasury configuration</p>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold font-heading mb-1">Discord Integration</h2>
              <p className="text-sm text-muted-foreground">Configure Discord announcements</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="discord-enabled">Enable Discord Announcements</Label>
              <Switch
                id="discord-enabled"
                checked={discordConfig?.enabled || false}
                onCheckedChange={(enabled) => handleDiscordUpdate({ enabled })}
                data-testid="switch-discord-enabled"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guild-id">Guild ID</Label>
              <Input
                id="guild-id"
                value={discordConfig?.guildId || ''}
                onChange={(e) => handleDiscordUpdate({ guildId: e.target.value })}
                placeholder="Enter Discord server ID"
                data-testid="input-guild-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-id">Channel ID</Label>
              <Input
                id="channel-id"
                value={discordConfig?.channelId || ''}
                onChange={(e) => handleDiscordUpdate({ channelId: e.target.value })}
                placeholder="Enter Discord channel ID"
                data-testid="input-channel-id"
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold font-heading mb-1">Treasury Wallets</h2>
              <p className="text-sm text-muted-foreground">Manage wallet addresses to monitor</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                placeholder="0x..."
                className="flex-1"
                data-testid="input-new-wallet"
              />
              <Button
                onClick={handleAddWallet}
                disabled={!newWallet.trim()}
                data-testid="button-add-wallet"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {treasuryWallets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No wallets configured. Add a wallet address to get started.
                </p>
              ) : (
                treasuryWallets.map((wallet) => (
                  <div
                    key={wallet}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-card/30"
                    data-testid={`wallet-item-${wallet}`}
                  >
                    <code className="text-sm font-mono">{wallet}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveWallet(wallet)}
                      data-testid={`button-remove-wallet-${wallet}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold font-heading mb-1">Safe Wallet Management</h2>
              <p className="text-sm text-muted-foreground">Manage multi-signature Safe wallets and transactions</p>
            </div>
          </div>

          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts" data-testid="tab-safe-accounts">Safe Accounts</TabsTrigger>
              <TabsTrigger value="propose" data-testid="tab-propose-transaction">Propose Transaction</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending-transactions">Pending Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="mt-6">
              <SafeManager />
            </TabsContent>

            <TabsContent value="propose" className="mt-6">
              <TransactionProposal />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              {import.meta.env.VITE_SAFE_ADDRESS ? (
                <PendingTransactions 
                  safeAddress={import.meta.env.VITE_SAFE_ADDRESS} 
                  chainId={1} 
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Configure VITE_SAFE_ADDRESS environment variable to view pending transactions
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
