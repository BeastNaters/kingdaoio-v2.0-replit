import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Chain } from "@shared";

interface WalletCardProps {
  label: string;
  address: string;
  chain: Chain;
  balance?: string;
  balanceUsd?: number;
  className?: string;
}

export function WalletCard({ 
  label, 
  address, 
  chain, 
  balance, 
  balanceUsd,
  className 
}: WalletCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const getExplorerUrl = (addr: string, chainType: Chain): string => {
    if (chainType === 'SOL') {
      return `https://solscan.io/account/${addr}`;
    }
    return `https://etherscan.io/address/${addr}`;
  };

  const truncateAddress = (addr: string): string => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <Card className={className} data-testid={`card-wallet-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-medium">{label}</CardTitle>
        {chain === 'SOL' && (
          <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
            Solana
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <code className="text-sm text-muted-foreground" data-testid={`text-address-${address.slice(0, 8)}`}>
            {truncateAddress(address)}
          </code>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopy}
              data-testid={`button-copy-${address.slice(0, 8)}`}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              asChild
              data-testid={`button-explorer-${address.slice(0, 8)}`}
            >
              <a
                href={getExplorerUrl(address, chain)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {balance && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-lg font-semibold" data-testid={`text-balance-${address.slice(0, 8)}`}>
              {balance}
            </div>
            {balanceUsd !== undefined && (
              <div className="text-sm text-muted-foreground" data-testid={`text-balance-usd-${address.slice(0, 8)}`}>
                ${balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
