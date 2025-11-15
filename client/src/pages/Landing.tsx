import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import bannerImage from '@assets/king-banner3_1763240561143.png';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
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
            <h1 className="text-5xl font-bold font-heading bg-gradient-to-r from-white via-white to-red-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              Welcome
            </h1>
            <h2 className="text-5xl font-bold font-heading">
              to <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,0,0,0.6)]">KingDAO</span>
            </h2>
          </div>
          
          <p className="text-white/80 text-base drop-shadow-lg">
            Web3 dashboard for Kong NFT holders
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <WalletConnect />
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-base shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-white/20"
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
