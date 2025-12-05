const SAFE_TX_SERVICE_URL = process.env.SAFE_TX_SERVICE_URL || 'https://safe-transaction-mainnet.safe.global';

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      redirect: 'follow',
    });
    if (response.ok) {
      const data = await response.json();
      return data.ethereum?.usd || 3500;
    }
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
  }
  return 3500;
}

export async function fetchSafeBalances() {
  const safeAddress = process.env.SAFE_ADDRESS;
  
  if (!safeAddress) {
    console.warn('SAFE_ADDRESS not configured, returning empty balances');
    return [];
  }

  try {
    const ethPrice = await getEthPrice();
    const response = await fetch(`${SAFE_TX_SERVICE_URL}/api/v1/safes/${safeAddress}/balances/?trusted=true&exclude_spam=true`, {
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`Safe API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.map((balance: any) => {
      const symbol = balance.token?.symbol || 'ETH';
      const amount = parseFloat(balance.balance) / Math.pow(10, balance.token?.decimals || 18);
      
      let usdValue = 0;
      if (!balance.tokenAddress) {
        usdValue = amount * ethPrice;
      } else if (symbol === 'USDC' || symbol === 'USDT' || symbol === 'DAI') {
        usdValue = amount;
      } else if (symbol === 'WETH') {
        usdValue = amount * ethPrice;
      }
      
      return {
        symbol,
        name: balance.token?.name || 'Ethereum',
        amount,
        usdPrice: amount > 0 ? usdValue / amount : 0,
        usdValue,
        source: 'safe' as const,
      };
    });
  } catch (error) {
    console.error('Error fetching Safe balances:', error);
    return [];
  }
}
