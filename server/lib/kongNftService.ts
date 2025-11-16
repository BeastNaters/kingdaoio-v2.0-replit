/**
 * Kong NFT Service
 * Queries Kong NFT (ERC-721) balances for DAO wallets
 */

import { daoWallets } from '@shared/daoWallets';
import { getAllConfiguredSafeWallets } from '@shared/safeWallets';

const KONG_NFT_CONTRACT = '0x6E3a2e08A88186f41ECD90E0683d9cA0983a4328';
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

  constructor() {
    this.rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || '';
    if (!this.rpcUrl) {
      console.warn('No RPC URL configured for Kong NFT queries');
    }
  }

  /**
   * Query Kong NFT balance for a single address using eth_call
   */
  async getKongNftBalance(address: string): Promise<number> {
    if (!this.rpcUrl) {
      throw new Error('RPC URL not configured');
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
              to: KONG_NFT_CONTRACT,
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
   */
  async getTotalDaoHoldings(): Promise<TotalKongNftHoldings> {
    const walletsToQuery: Array<{ address: string; label: string; type: 'safe' | 'controller' }> = [];

    // Get all configured Safe wallets
    const safeWallets = getAllConfiguredSafeWallets();
    safeWallets.forEach(wallet => {
      walletsToQuery.push({
        address: wallet.address,
        label: wallet.name,
        type: 'safe',
      });
    });

    // Add controller ETH wallet
    const controllerWallet = daoWallets.controller.find(w => w.chain === 'ETH' && w.label === 'Controller (ETH)');
    if (controllerWallet) {
      walletsToQuery.push({
        address: controllerWallet.address,
        label: controllerWallet.label,
        type: 'controller',
      });
    }

    // Query all wallets in parallel
    const results = await Promise.allSettled(
      walletsToQuery.map(async (wallet) => {
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
      const wallet = walletsToQuery[index];
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
