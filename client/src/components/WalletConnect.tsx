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
        className="gap-2 bg-red-700/30 hover:bg-red-700/40 text-white font-bold text-sm backdrop-blur-sm drop-shadow-lg !border-none !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none h-10 px-5"
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
      className="gap-2 bg-[#b81414] hover:bg-red-800 text-white font-bold text-sm drop-shadow-xl !border-none !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none h-10 px-5"
      onClick={handleConnect}
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4" />
      <span className="font-semibold">Connect Wallet</span>
    </Button>
  );
}
