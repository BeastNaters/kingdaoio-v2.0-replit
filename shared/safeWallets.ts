/**
 * Safe Multi-Sig Wallet Configuration
 * Defines metadata for KingDAO's Gnosis Safe wallets
 */

export interface SafeWalletConfig {
  id: string;
  name: string;
  envVarName: string;
  description: string;
  chainId: number;
  category: 'treasury' | 'rewards' | 'dca' | 'incentive';
}

/**
 * Configuration for all KingDAO Safe multi-sig wallets
 * Addresses are loaded from environment variables at runtime
 */
export const SAFE_WALLETS: SafeWalletConfig[] = [
  {
    id: 'dao-fund',
    name: 'DAO Treasury Fund',
    envVarName: 'SAFE_DAO_FUND_ADDRESS_ETH',
    description: 'Main DAO treasury fund for protocol holdings and governance',
    chainId: 1,
    category: 'treasury',
  },
  {
    id: 'rewards',
    name: 'Reward Distribution',
    envVarName: 'SAFE_REWARD_WALLET_ADDRESS',
    description: 'Wallet for distributing rewards to Kong NFT holders',
    chainId: 1,
    category: 'rewards',
  },
  {
    id: 'dcap',
    name: 'DCA Portfolio',
    envVarName: 'SAFE_DCAP_WALLET_ADDRESS',
    description: 'Dollar-cost averaging and tactical trading portfolio',
    chainId: 1,
    category: 'dca',
  },
  {
    id: 'incentive',
    name: 'Incentivization Bucket',
    envVarName: 'SAFE_INCENTIVE_WALLET_ADDRESS',
    description: 'Wallet for community incentives and ecosystem growth initiatives',
    chainId: 1,
    category: 'treasury',
  },
];

/**
 * Helper function to get Safe wallet address from environment
 * Server-side only - uses process.env
 */
export function getSafeWalletAddress(walletId: string): string | undefined {
  if (typeof process === 'undefined') {
    throw new Error('getSafeWalletAddress can only be called server-side');
  }
  
  const config = SAFE_WALLETS.find(w => w.id === walletId);
  if (!config) {
    throw new Error(`Unknown Safe wallet ID: ${walletId}`);
  }
  
  return process.env[config.envVarName];
}

/**
 * Helper function to get all configured Safe wallet addresses
 * Server-side only - uses process.env
 * Returns only wallets that have addresses configured
 */
export function getAllConfiguredSafeWallets(): Array<SafeWalletConfig & { address: string }> {
  if (typeof process === 'undefined') {
    throw new Error('getAllConfiguredSafeWallets can only be called server-side');
  }
  
  return SAFE_WALLETS
    .map(config => ({
      ...config,
      address: process.env[config.envVarName],
    }))
    .filter((wallet): wallet is SafeWalletConfig & { address: string } => 
      wallet.address !== undefined && wallet.address !== ''
    );
}
