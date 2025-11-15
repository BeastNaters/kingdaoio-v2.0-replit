import SafeApiKit from '@safe-global/api-kit';

const SAFE_TX_SERVICE_URLS: { [chainId: number]: string } = {
  1: 'https://safe-transaction-mainnet.safe.global',
  11155111: 'https://safe-transaction-sepolia.safe.global',
  100: 'https://safe-transaction-gnosis-chain.safe.global',
  137: 'https://safe-transaction-polygon.safe.global',
};

export class SafeService {
  private chainId: number;

  constructor(chainId: number = 1) {
    this.chainId = chainId;
  }

  private getApiKit(chainId: number): SafeApiKit {
    const txServiceUrl = SAFE_TX_SERVICE_URLS[chainId];
    if (!txServiceUrl) {
      throw new Error(`Safe Transaction Service not available for chainId ${chainId}`);
    }
    
    return new SafeApiKit({
      chainId: BigInt(chainId),
    });
  }

  async getPendingTransactions(safeAddress: string, chainId: number): Promise<any[]> {
    const apiKit = this.getApiKit(chainId);
    const pendingTxs = await apiKit.getPendingTransactions(safeAddress);
    return pendingTxs.results;
  }

  async getTransactionHistory(safeAddress: string, chainId: number): Promise<any[]> {
    const apiKit = this.getApiKit(chainId);
    const history = await apiKit.getMultisigTransactions(safeAddress);
    return history.results;
  }

  async getTransaction(safeTxHash: string, chainId: number): Promise<any> {
    const apiKit = this.getApiKit(chainId);
    return await apiKit.getTransaction(safeTxHash);
  }

  async getSafeBalances(safeAddress: string, chainId: number = 1): Promise<any[]> {
    const txServiceUrl = SAFE_TX_SERVICE_URLS[chainId];
    if (!txServiceUrl) {
      throw new Error(`Safe Transaction Service not available for chainId ${chainId}`);
    }

    try {
      const response = await fetch(`${txServiceUrl}/api/v1/safes/${safeAddress}/balances/usd/`);
      
      if (!response.ok) {
        throw new Error(`Safe API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.map((balance: any) => ({
        symbol: balance.token?.symbol || 'ETH',
        name: balance.token?.name || 'Ethereum',
        amount: parseFloat(balance.balance) / Math.pow(10, balance.token?.decimals || 18),
        usdPrice: parseFloat(balance.fiatConversion) || 0,
        usdValue: parseFloat(balance.fiatBalance) || 0,
        source: 'safe' as const,
        tokenAddress: balance.tokenAddress,
      }));
    } catch (error) {
      console.error('Error fetching Safe balances:', error);
      return [];
    }
  }

  async getSafeInfo(safeAddress: string, chainId: number = 1): Promise<any> {
    const txServiceUrl = SAFE_TX_SERVICE_URLS[chainId];
    if (!txServiceUrl) {
      throw new Error(`Safe Transaction Service not available for chainId ${chainId}`);
    }

    try {
      const response = await fetch(`${txServiceUrl}/api/v1/safes/${safeAddress}/`);
      
      if (!response.ok) {
        throw new Error(`Safe API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Safe info:', error);
      throw error;
    }
  }
}

export const safeService = new SafeService();
