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
      <Card className="max-w-lg w-full mx-4 bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <CardContent className="pt-16 pb-12 px-10 text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold font-heading">
              Welcome
            </h1>
            <h2 className="text-4xl font-bold font-heading text-primary">
              to KingDAO
            </h2>
          </div>
          
          <p className="text-muted-foreground">
            Web3 dashboard for Kong NFT holders
          </p>

          <Button
            size="lg"
            className="w-full mt-8 text-lg py-6"
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
