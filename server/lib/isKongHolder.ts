export async function isKongHolder(address: string): Promise<boolean> {
  const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  const kongNftContract = process.env.BETTING_KONGS_TOKEN_CONTRACT_ADDRESS;
  
  if (!rpcUrl) {
    console.error('ETHEREUM_RPC_URL not configured');
    return false;
  }

  if (!kongNftContract) {
    console.error('BETTING_KONGS_TOKEN_CONTRACT_ADDRESS not configured');
    return false;
  }

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }

  try {
    const data = `0x70a08231${address.slice(2).padStart(64, '0')}`;
    
    const response = await fetch(rpcUrl, {
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
            to: kongNftContract,
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
      throw new Error(result.error.message);
    }

    const balance = parseInt(result.result, 16);
    return balance > 0;
  } catch (error) {
    console.error('Error checking Kong NFT balance:', error);
    return false;
  }
}
