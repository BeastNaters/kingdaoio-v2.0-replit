import { Link, useLocation } from "wouter";
import { WalletConnect } from "./WalletConnect";
import { Settings } from "lucide-react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import emblemImage from '@assets/king-emblem_1763241496953.png';

export function Navbar() {
  const [location] = useLocation();
  const { isAdmin } = useAdminStatus();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/nfts", label: "NFTs" },
    { href: "/community", label: "Community" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg">
              <img src={emblemImage} alt="King DAO" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-bold font-heading hidden sm:inline text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.7)] [text-shadow:_1px_1px_0_rgba(0,0,0,0.7),_-1px_1px_0_rgba(0,0,0,0.7),_1px_-1px_0_rgba(0,0,0,0.7),_-1px_-1px_0_rgba(0,0,0,0.7)]">KingDAO</span>
          </Link>

          {location !== "/" && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === link.href
                      ? "text-foreground bg-white/5"
                      : "text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    location === "/admin"
                      ? "text-foreground bg-white/5"
                      : "text-muted-foreground hover-elevate"
                  }`}
                  data-testid="link-nav-admin"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <WalletConnect size="default" />
        </div>
      </div>
    </nav>
  );
}
