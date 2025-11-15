import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-white font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button
          size="icon"
          className="bg-red-600 hover:bg-red-700 text-white border-2 border-black"
          onClick={() => disconnect()}
          data-testid="button-disconnect-wallet"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="gap-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black font-bold"
      onClick={handleConnect}
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
}
