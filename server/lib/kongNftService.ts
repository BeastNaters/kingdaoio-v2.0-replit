/**
 * Kong NFT Service
 * Queries Kong NFT (ERC-721) balances for DAO wallets
 */

import { daoWallets } from '@shared/daoWallets';
import { getAllConfiguredSafeWallets } from '@shared/safeWallets';

const ERC721_BALANCE_OF_SELECTOR = '0x70a08231'; // balanceOf(address)

export interface KongNftBalance {
  address: string;
  label: string;
  balance: number;
  walletType: 'safe' | 'controller';
  error: string | null;
}

export interface TotalKongNftHoldings {
  totalBalance: number;
  wallets: KongNftBalance[];
  timestamp: string;
}

class KongNftService {
  private rpcUrl: string;
  private kongNftContract: string;

  constructor() {
    this.rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || '';
    this.kongNftContract = process.env.BETTING_KONGS_TOKEN_CONTRACT_ADDRESS || '';
    
    if (!this.rpcUrl) {
      console.warn('No RPC URL configured for Kong NFT queries');
    }
    if (!this.kongNftContract) {
      console.warn('Kong NFT contract address not configured (BETTING_KONGS_TOKEN_CONTRACT_ADDRESS)');
    }
  }

  /**
   * Query Kong NFT balance for a single address using eth_call
   */
  async getKongNftBalance(address: string): Promise<number> {
    if (!this.rpcUrl) {
      throw new Error('RPC URL not configured');
    }

    if (!this.kongNftContract) {
      throw new Error('Kong NFT contract address not configured (BETTING_KONGS_TOKEN_CONTRACT_ADDRESS)');
    }

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid Ethereum address');
    }

    try {
      // Encode balanceOf(address) call data
      const data = `${ERC721_BALANCE_OF_SELECTOR}${address.slice(2).padStart(64, '0')}`;
      
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: this.kongNftContract,
              data,
            },
            'latest',
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'RPC call failed');
      }

      const balance = parseInt(result.result, 16);
      return balance;
    } catch (error) {
      console.error(`Error querying Kong NFT balance for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get total Kong NFT holdings across all DAO wallets
   * Queries all Safe multi-sig wallets and the controller ETH wallet
   * Deduplicates by address to prevent double-counting
   */
  async getTotalDaoHoldings(): Promise<TotalKongNftHoldings> {
    const walletsToQuery: Array<{ address: string; label: string; type: 'safe' | 'controller' }> = [];

    // Get all configured Safe wallets
    const safeWallets = getAllConfiguredSafeWallets();
    safeWallets.forEach(wallet => {
      walletsToQuery.push({
        address: wallet.address.toLowerCase(), // Normalize to lowercase for deduplication
        label: wallet.name,
        type: 'safe',
      });
    });

    // Add controller ETH wallet
    const controllerWallet = daoWallets.controller.find(w => w.chain === 'ETH' && w.label === 'Controller (ETH)');
    if (controllerWallet) {
      walletsToQuery.push({
        address: controllerWallet.address.toLowerCase(), // Normalize to lowercase for deduplication
        label: controllerWallet.label,
        type: 'controller',
      });
    }

    // Deduplicate wallets by address (keep first occurrence)
    const uniqueWallets = walletsToQuery.filter((wallet, index, self) =>
      index === self.findIndex(w => w.address === wallet.address)
    );

    if (uniqueWallets.length < walletsToQuery.length) {
      console.warn(`Deduplicated ${walletsToQuery.length - uniqueWallets.length} duplicate wallet address(es)`);
    }

    // Query all unique wallets in parallel
    const results = await Promise.allSettled(
      uniqueWallets.map(async (wallet) => {
        try {
          const balance = await this.getKongNftBalance(wallet.address);
          return {
            address: wallet.address,
            label: wallet.label,
            balance,
            walletType: wallet.type,
            error: null,
          } as KongNftBalance;
        } catch (error) {
          return {
            address: wallet.address,
            label: wallet.label,
            balance: 0,
            walletType: wallet.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as KongNftBalance;
        }
      })
    );

    // Map all results to wallet balance objects, handling both fulfilled and rejected promises
    const wallets: KongNftBalance[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      
      // If promise rejected despite try-catch (shouldn't happen, but handle gracefully)
      const wallet = uniqueWallets[index];
      return {
        address: wallet.address,
        label: wallet.label,
        balance: 0,
        walletType: wallet.type,
        error: result.reason instanceof Error ? result.reason.message : 'Unexpected error',
      };
    });

    // Calculate total balance
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    return {
      totalBalance,
      wallets,
      timestamp: new Date().toISOString(),
    };
  }
}

export const kongNftService = new KongNftService();
