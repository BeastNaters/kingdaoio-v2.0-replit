import { fetchTokenPrices, fetchWalletBalances } from './dune';
import { fetchSafeBalances } from './safe';
import { fetchAllTreasuryData } from './googleSheets';
import { upsertSnapshot } from './supabase';
import { getSocketIO } from '../routes';

const DEFAULT_SNAPSHOT_INTERVAL = 15 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

let snapshotTimer: NodeJS.Timeout | null = null;
let isRunning = false;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAndSaveSnapshot(retries = 0): Promise<void> {
  if (isRunning) {
    console.log('Snapshot generation already in progress, skipping...');
    return;
  }

  isRunning = true;

  try {
    console.log('Scheduled snapshot generation started...');

    const [tokenPrices, safeBalances, duneBalances, sheetData] = await Promise.all([
      fetchTokenPrices().catch(err => {
        console.warn('Failed to fetch token prices:', err);
        return [];
      }),
      fetchSafeBalances().catch(err => {
        console.warn('Failed to fetch Safe balances:', err);
        return [];
      }),
      fetchWalletBalances().catch(err => {
        console.warn('Failed to fetch wallet balances:', err);
        return [];
      }),
      fetchAllTreasuryData().catch(err => {
        console.warn('Failed to fetch sheet data:', err);
        return null;
      }),
    ]);

    const priceMap = new Map(tokenPrices.map(p => [p.symbol, p.price]));
    
    const tokenMap = new Map<string, any>();

    safeBalances.forEach(token => {
      tokenMap.set(token.symbol, { ...token, source: 'safe' });
    });

    duneBalances.forEach(wallet => {
      wallet.tokens.forEach(token => {
        if (!tokenMap.has(token.symbol) || tokenMap.get(token.symbol).source !== 'safe') {
          const existing = tokenMap.get(token.symbol);
          if (existing) {
            existing.amount += token.amount;
          } else {
            tokenMap.set(token.symbol, {
              symbol: token.symbol,
              amount: token.amount,
              usdPrice: priceMap.get(token.symbol),
              usdValue: (priceMap.get(token.symbol) || 0) * token.amount,
              source: 'dune' as const,
            });
          }
        }
      });
    });

    if (sheetData) {
      sheetData.dcaPortfolio.forEach(token => {
        const existing = tokenMap.get(token.token);
        if (existing) {
          existing.amount += token.amount;
          existing.usdValue = (existing.usdValue || 0) + token.usdValue;
        } else {
          tokenMap.set(token.token, {
            symbol: token.token,
            amount: token.amount,
            usdPrice: token.priceUsd,
            usdValue: token.usdValue,
            source: 'sheets' as const,
          });
        }
      });

      sheetData.otherTokens.forEach(token => {
        const existing = tokenMap.get(token.token);
        if (existing) {
          existing.amount += token.amount;
          existing.usdValue = (existing.usdValue || 0) + token.usdValue;
        } else {
          tokenMap.set(token.token, {
            symbol: token.token,
            amount: token.amount,
            usdPrice: token.priceUsd,
            usdValue: token.usdValue,
            source: 'sheets' as const,
          });
        }
      });
    }

    const allTokens = Array.from(tokenMap.values());

    allTokens.forEach(token => {
      if (token.usdPrice && !token.usdValue) {
        token.usdValue = token.usdPrice * token.amount;
      }
    });

    const sheetsTotalValue = sheetData?.totals?.grandTotal || 0;
    const tokensTotalValue = allTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const totalUsdValue = Math.max(tokensTotalValue, sheetsTotalValue);

    const snapshot = {
      timestamp: new Date().toISOString(),
      totalUsdValue,
      tokens: allTokens,
      nfts: [],
      wallets: duneBalances.map(w => ({ address: w.address, chainId: 1 })),
    };

    const saved = await upsertSnapshot(snapshot);
    console.log(`✓ Scheduled snapshot saved: ${saved?.id}, value: $${totalUsdValue.toFixed(2)}`);

    const io = getSocketIO();
    if (io) {
      io.emit('treasury:update', {
        totalUsdValue,
        timestamp: snapshot.timestamp,
        tokenCount: allTokens.length,
      });
      console.log('WebSocket event emitted: treasury:update');
    }
  } catch (error) {
    console.error('Error in scheduled snapshot generation:', error);
    
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retries);
      console.log(`Retrying in ${delay / 1000}s (attempt ${retries + 1}/${MAX_RETRIES})...`);
      await sleep(delay);
      await generateAndSaveSnapshot(retries + 1);
    } else {
      console.error('Max retries reached for snapshot generation');
    }
  } finally {
    isRunning = false;
  }
}

export function startSnapshotScheduler(): void {
  if (snapshotTimer) {
    console.log('Snapshot scheduler already running');
    return;
  }

  const intervalMs = parseInt(process.env.SNAPSHOT_INTERVAL || String(DEFAULT_SNAPSHOT_INTERVAL), 10);
  console.log(`Starting snapshot scheduler (interval: ${intervalMs / 1000 / 60} minutes)`);

  snapshotTimer = setInterval(() => {
    generateAndSaveSnapshot();
  }, intervalMs);

  generateAndSaveSnapshot();
}

export function stopSnapshotScheduler(): void {
  if (snapshotTimer) {
    clearInterval(snapshotTimer);
    snapshotTimer = null;
    console.log('Snapshot scheduler stopped');
  }
}
