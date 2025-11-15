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
        className="gap-2 bg-red-600/30 hover:bg-red-600/40 text-white border-2 border-black font-bold px-4 py-5 text-base backdrop-blur-sm"
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
      className="gap-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black font-bold px-4 py-5 text-base"
      onClick={handleConnect}
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
}
