import SafeApiKit from '@safe-global/api-kit';

const SAFE_TX_SERVICE_URLS: { [chainId: number]: string } = {
  1: 'https://safe-transaction-mainnet.safe.global',
  5: 'https://safe-transaction-goerli.safe.global',
  11155111: 'https://safe-transaction-sepolia.safe.global',
  10: 'https://safe-transaction-optimism.safe.global',
  100: 'https://safe-transaction-gnosis-chain.safe.global',
  137: 'https://safe-transaction-polygon.safe.global',
  56: 'https://safe-transaction-bsc.safe.global',
  42161: 'https://safe-transaction-arbitrum.safe.global',
  8453: 'https://safe-transaction-base.safe.global',
  43114: 'https://safe-transaction-avalanche.safe.global',
  42220: 'https://safe-transaction-celo.safe.global',
  1101: 'https://safe-transaction-zkevm.safe.global',
  324: 'https://safe-transaction-zksync.safe.global',
};

const NATIVE_TOKEN_METADATA: { [chainId: number]: { symbol: string; name: string; decimals: number } } = {
  1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  5: { symbol: 'ETH', name: 'Goerli ETH', decimals: 18 },
  11155111: { symbol: 'ETH', name: 'Sepolia ETH', decimals: 18 },
  10: { symbol: 'ETH', name: 'Optimism', decimals: 18 },
  100: { symbol: 'xDAI', name: 'xDAI', decimals: 18 },
  137: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
  56: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  42161: { symbol: 'ETH', name: 'Arbitrum', decimals: 18 },
  8453: { symbol: 'ETH', name: 'Base', decimals: 18 },
  43114: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
  42220: { symbol: 'CELO', name: 'Celo', decimals: 18 },
  1101: { symbol: 'ETH', name: 'Polygon zkEVM', decimals: 18 },
  324: { symbol: 'ETH', name: 'zkSync Era', decimals: 18 },
};

export interface SafeInfo {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  version: string;
  masterCopy: string;
  modules: string[];
  fallbackHandler: string;
  guard: string | null;
  chainId: number;
}

export interface SafeBalance {
  tokenAddress: string | null;
  token: {
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
  } | null;
  balance: string;
  fiatBalance: string;
  fiatConversion: string;
  fiatCode: string;
}

export interface SafeMultisigTransaction {
  safe: string;
  to: string;
  value: string;
  data: string | null;
  operation: number;
  gasToken: string;
  safeTxGas: number;
  baseGas: number;
  gasPrice: string;
  refundReceiver: string;
  nonce: number;
  executionDate: string | null;
  submissionDate: string;
  modified: string;
  blockNumber: number | null;
  transactionHash: string | null;
  safeTxHash: string;
  executor: string | null;
  isExecuted: boolean;
  isSuccessful: boolean | null;
  ethGasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasUsed: number | null;
  fee: string | null;
  origin: string | null;
  dataDecoded: any | null;
  confirmationsRequired: number;
  confirmations: SafeConfirmation[];
  trusted: boolean;
  signatures: string | null;
}

export interface SafeConfirmation {
  owner: string;
  submissionDate: string;
  transactionHash: string | null;
  signature: string;
  signatureType: string;
}

export class SafeService {
  private chainId: number;

  constructor(chainId: number = 1) {
    this.chainId = chainId;
  }

  private getTxServiceUrl(chainId: number): string {
    const url = SAFE_TX_SERVICE_URLS[chainId];
    if (!url) {
      throw new Error(`Safe Transaction Service not available for chainId ${chainId}`);
    }
    return url;
  }

  private getApiKit(chainId: number): SafeApiKit {
    return new SafeApiKit({
      chainId: BigInt(chainId),
    });
  }

  async getSafeInfo(safeAddress: string, chainId: number = 1): Promise<SafeInfo> {
    const baseUrl = this.getTxServiceUrl(chainId);
    
    const response = await fetch(`${baseUrl}/api/v1/safes/${safeAddress}/`);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ...data, chainId };
  }

  async getSafeBalances(safeAddress: string, chainId: number = 1): Promise<SafeBalance[]> {
    const baseUrl = this.getTxServiceUrl(chainId);

    const response = await fetch(`${baseUrl}/api/v1/safes/${safeAddress}/balances/usd/`);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getMultisigTransactions(
    safeAddress: string, 
    chainId: number = 1,
    options: {
      executed?: boolean;
      limit?: number;
      offset?: number;
      ordering?: string;
    } = {}
  ): Promise<{ count: number; next: string | null; previous: string | null; results: SafeMultisigTransaction[] }> {
    const baseUrl = this.getTxServiceUrl(chainId);
    
    const params = new URLSearchParams();
    if (options.executed !== undefined) params.append('executed', String(options.executed));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));
    if (options.ordering) params.append('ordering', options.ordering);

    const url = `${baseUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?${params.toString()}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPendingTransactions(safeAddress: string, chainId: number): Promise<SafeMultisigTransaction[]> {
    const data = await this.getMultisigTransactions(safeAddress, chainId, {
      executed: false,
      ordering: '-nonce',
    });
    return data.results;
  }

  async getTransactionHistory(safeAddress: string, chainId: number, limit: number = 20): Promise<SafeMultisigTransaction[]> {
    const data = await this.getMultisigTransactions(safeAddress, chainId, {
      executed: true,
      ordering: '-executionDate',
      limit,
    });
    return data.results;
  }

  async getTransaction(safeTxHash: string, chainId: number): Promise<SafeMultisigTransaction> {
    const baseUrl = this.getTxServiceUrl(chainId);

    const response = await fetch(`${baseUrl}/api/v1/multisig-transactions/${safeTxHash}/`);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getTransactionConfirmations(safeTxHash: string, chainId: number): Promise<SafeConfirmation[]> {
    const baseUrl = this.getTxServiceUrl(chainId);

    const response = await fetch(`${baseUrl}/api/v1/multisig-transactions/${safeTxHash}/confirmations/`);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getAllTransactions(
    safeAddress: string,
    chainId: number = 1,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ count: number; next: string | null; previous: string | null; results: any[] }> {
    const baseUrl = this.getTxServiceUrl(chainId);
    
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const url = `${baseUrl}/api/v1/safes/${safeAddress}/all-transactions/?${params.toString()}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getIncomingTransfers(
    safeAddress: string,
    chainId: number = 1,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    const baseUrl = this.getTxServiceUrl(chainId);
    
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const url = `${baseUrl}/api/v1/safes/${safeAddress}/incoming-transfers/?${params.toString()}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getSafesByOwner(ownerAddress: string, chainId: number = 1): Promise<{ safes: string[] }> {
    const baseUrl = this.getTxServiceUrl(chainId);

    const response = await fetch(`${baseUrl}/api/v1/owners/${ownerAddress}/safes/`);
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async estimateTransaction(
    safeAddress: string,
    to: string,
    value: string,
    data: string,
    operation: number,
    chainId: number = 1
  ): Promise<any> {
    const baseUrl = this.getTxServiceUrl(chainId);

    const response = await fetch(
      `${baseUrl}/api/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          value,
          data,
          operation,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    return await response.json();
  }

  formatBalancesForDisplay(balances: SafeBalance[], chainId: number = 1): any[] {
    const nativeToken = NATIVE_TOKEN_METADATA[chainId] || NATIVE_TOKEN_METADATA[1];
    
    return balances.map((balance: SafeBalance) => ({
      symbol: balance.token?.symbol || nativeToken.symbol,
      name: balance.token?.name || nativeToken.name,
      amount: parseFloat(balance.balance) / Math.pow(10, balance.token?.decimals || nativeToken.decimals),
      usdPrice: parseFloat(balance.fiatConversion) || 0,
      usdValue: parseFloat(balance.fiatBalance) || 0,
      source: 'safe' as const,
      tokenAddress: balance.tokenAddress,
      logoUri: balance.token?.logoUri,
    }));
  }

  /**
   * Fetch balances from multiple Safe wallets in parallel
   * Returns wallet metadata along with balances and total USD value
   * Always returns proper wallet objects even when individual fetches fail
   */
  async getMultipleWalletsBalances(wallets: Array<{ id: string; name: string; address: string; description: string; chainId: number }>): Promise<Array<{
    walletId: string;
    walletName: string;
    walletDescription: string;
    address: string;
    chainId: number;
    balances: any[];
    totalUsdValue: number;
    error: string | null;
  }>> {
    const results = await Promise.allSettled(
      wallets.map(async (wallet) => {
        try {
          const balances = await this.getSafeBalances(wallet.address, wallet.chainId);
          const formattedBalances = this.formatBalancesForDisplay(balances, wallet.chainId);
          const totalUsdValue = formattedBalances.reduce((sum, token) => sum + token.usdValue, 0);

          return {
            walletId: wallet.id,
            walletName: wallet.name,
            walletDescription: wallet.description,
            address: wallet.address,
            chainId: wallet.chainId,
            balances: formattedBalances,
            totalUsdValue,
            error: null,
          };
        } catch (error) {
          return {
            walletId: wallet.id,
            walletName: wallet.name,
            walletDescription: wallet.description,
            address: wallet.address,
            chainId: wallet.chainId,
            balances: [],
            totalUsdValue: 0,
            error: error instanceof Error ? error.message : 'Unknown error fetching wallet balances',
          };
        }
      })
    );

    // Map all results to wallet objects, handling both fulfilled and rejected promises
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      
      // If promise rejected despite try-catch (shouldn't happen, but handle gracefully)
      const wallet = wallets[index];
      return {
        walletId: wallet.id,
        walletName: wallet.name,
        walletDescription: wallet.description,
        address: wallet.address,
        chainId: wallet.chainId,
        balances: [],
        totalUsdValue: 0,
        error: result.reason instanceof Error ? result.reason.message : 'Unexpected error fetching wallet',
      };
    });
  }
}

export const safeService = new SafeService();
