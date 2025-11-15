import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

interface WalletConnectProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function WalletConnect({ size = 'default' }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  if (isConnected && address) {
    return (
      <Button
        size={size}
        className="gap-2 bg-red-700/30 hover:bg-red-700/40 text-white font-bold text-sm backdrop-blur-sm shadow-[0_6px_12px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.2),inset_0_-2px_0_rgba(0,0,0,0.2)]"
        onClick={() => disconnect()}
        data-testid="button-disconnect-wallet"
      >
        <span className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className="gap-2 bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-[0_8px_15px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.3)]"
      onClick={handleConnect}
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
}
