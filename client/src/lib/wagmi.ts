import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, gnosis, polygon } from 'wagmi/chains';

export const supportedChains = [mainnet, sepolia, gnosis, polygon] as const;

export const config = createConfig({
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
    [sepolia.id]: http('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
    [gnosis.id]: http('https://rpc.gnosischain.com'),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
});
