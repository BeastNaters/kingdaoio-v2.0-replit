import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="max-w-lg w-full mx-4 bg-background/40 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardContent className="pt-16 pb-12 px-10 text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold font-heading text-foreground">
              Welcome
            </h1>
            <h2 className="text-5xl font-bold font-heading">
              to <span className="text-red-600 dark:text-red-500">KingDAO</span>
            </h2>
          </div>
          
          <p className="text-muted-foreground text-base">
            Web3 dashboard for Kong NFT holders
          </p>

          <Button
            size="lg"
            className="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white px-8 py-6 text-base"
            onClick={() => setLocation('/dashboard')}
            data-testid="button-open-dashboard"
          >
            Open Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
