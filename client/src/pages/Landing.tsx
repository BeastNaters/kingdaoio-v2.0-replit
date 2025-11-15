import { useLocation } from "wouter";
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import bannerImage from '@assets/king-banner3_1763240561143.png';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isConnected } = useAccount();

  return (
    <div 
      className="fixed inset-0 w-full h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      data-testid="page-landing"
    >
      <Card className="max-w-lg w-full mx-4 bg-white/10 dark:bg-black/10 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]">
        <CardContent className="pt-[25px] pb-[25px] pl-[50px] pr-[50px] ml-[10px] mr-[10px] text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-heading text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)] font-semibold">
              Welcome
            </h1>
            <h2 className="text-6xl font-extrabold font-heading text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
              to <span className="drop-shadow-[0_4px_12px_rgba(185,28,28,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)] text-[#b81414]">KingDAO</span>
            </h2>
          </div>
          
          <p className="text-white text-lg font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)]">Treasury Dashboard for Kong Holders</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <WalletConnect />
            <Button
              size="lg"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-primary-border min-h-10 rounded-md px-8 py-6 text-base transition-all !border-none !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none bg-transparent hover:bg-white/10 text-white/60 drop-shadow-lg font-semibold"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-enter-dashboard"
            >
              Enter Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
