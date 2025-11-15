import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import bannerImage from '@assets/king-banner3_1763240561143.png';

export default function Landing() {
  const [, setLocation] = useLocation();

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
        <CardContent className="pt-16 pb-12 px-10 text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-extrabold font-heading text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
              Welcome
            </h1>
            <h2 className="text-6xl font-extrabold font-heading">
              to <span className="text-red-600 drop-shadow-[0_4px_12px_rgba(220,38,38,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">KingDAO</span>
            </h2>
          </div>
          
          <p className="text-white text-lg font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)]">
            Web3 dashboard for Kong NFT holders
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white hover:bg-gray-100 text-black font-bold px-8 py-6 text-base shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-black"
              onClick={() => {}}
              data-testid="button-connect-wallet"
            >
              Connect Wallet
            </Button>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 text-base shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-black"
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
