import { useAccount, useReadContract } from 'wagmi';
import { TokenGated } from './TokenGated';
import { Skeleton } from './ui/skeleton';
import { ERC721_ABI } from '@shared/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { address, isConnected } = useAccount();
  const kongNftContract = import.meta.env.VITE_BETTING_KONGS_TOKEN_CONTRACT_ADDRESS as `0x${string}`;

  const { data: balance, isLoading } = useReadContract({
    address: kongNftContract,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && !!kongNftContract,
    },
  });

  if (!isConnected || !address) {
    return <TokenGated />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isHolder = balance !== undefined && Number(balance) > 0;

  if (!isHolder) {
    return <TokenGated />;
  }

  return <>{children}</>;
}
