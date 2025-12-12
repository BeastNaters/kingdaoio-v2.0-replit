import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { isKongHolder } from "./lib/isKongHolder";
import { fetchTokenPrices, fetchNftFloors, fetchWalletBalances, fetchKongNftFloorPrice } from "./lib/dune";
import { fetchSafeBalances } from "./lib/safe";
import { 
  fetchNftCollections, 
  fetchDcaPortfolio, 
  fetchOtherTokens, 
  fetchMultiSigWallets, 
  fetchDaoWallets, 
  fetchTacticalWallets,
  fetchAllTreasuryData,
  fetchTreasuryHistory,
  fetchDcaHistory
} from "./lib/googleSheets";
import { fetchSnapshotProposals } from "./lib/snapshot";
import { fetchDiscordAnnouncements } from "./lib/discord";
import { getLatestSnapshot, upsertSnapshot, getHistoricalSnapshots } from "./lib/supabase";
import { requireAdmin } from "./middleware/adminAuth";
import { generateCsvData, generatePdfReport } from "./lib/exportUtils";
import { sanitizeError, createErrorResponse } from "./lib/errorHandler";
import { verifyMessage } from "viem";
import { insertCommunityMessageSchema, insertCommunityMemberSchema, insertSafeTransactionSchema, insertSafeConfirmationSchema } from "@shared/schema";
import { SafeService } from "./lib/safeService";
import { kongNftService } from "./lib/kongNftService";

const ADMIN_ADDRESSES = (process.env.ADMIN_ADDRESSES || '').toLowerCase().split(',').filter(Boolean);

let io: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/auth/holdings", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address || typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Address parameter required',
        });
      }

      const isHolder = await isKongHolder(address);
      
      return res.json({
        success: true,
        isHolder,
        address,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to check NFT holdings')
      );
    }
  });

  app.post("/api/auth/is-admin", async (req, res) => {
    try {
      const { walletAddress, signature, timestamp } = req.body;

      if (!walletAddress || !signature || !timestamp) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: walletAddress, signature, timestamp',
        });
      }

      const timestampNum = parseInt(timestamp, 10);
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(currentTime - timestampNum) > fiveMinutes) {
        return res.status(401).json({
          success: false,
          message: 'Signature expired',
        });
      }

      const message = `KingDAO Admin Check\nTimestamp: ${timestamp}`;
      const isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature',
        });
      }

      const isAdmin = ADMIN_ADDRESSES.includes(walletAddress.toLowerCase());

      return res.json({
        success: true,
        isAdmin,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Admin check failed')
      );
    }
  });

  app.get("/api/dune/token-prices", async (req, res) => {
    try {
      const prices = await fetchTokenPrices();
      return res.json({
        success: true,
        data: prices,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch token prices')
      );
    }
  });

  app.get("/api/dune/nft-floors", async (req, res) => {
    try {
      const floors = await fetchNftFloors();
      return res.json({
        success: true,
        data: floors,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch NFT floor prices')
      );
    }
  });

  app.get("/api/kong-nfts/floor-price", async (req, res) => {
    try {
      const floorPrice = await fetchKongNftFloorPrice();
      return res.json({
        success: true,
        data: {
          floorPrice,
          currency: 'ETH',
          source: process.env.DUNE_NFT_FLOOR_PRICES_QUERY_ID ? 'dune' : 'static',
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Kong NFT floor price')
      );
    }
  });

  app.get("/api/dune/wallet-balances", async (req, res) => {
    try {
      const balances = await fetchWalletBalances();
      return res.json({
        success: true,
        data: balances,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch wallet balances')
      );
    }
  });

  app.get("/api/treasury/safe", async (req, res) => {
    try {
      const balances = await fetchSafeBalances();
      return res.json(balances);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Safe balances')
      );
    }
  });

  app.get("/api/sheets/all", async (req, res) => {
    try {
      const data = await fetchAllTreasuryData();
      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch treasury sheet data')
      );
    }
  });

  app.get("/api/sheets/nfts", async (req, res) => {
    try {
      const nftCollections = await fetchNftCollections();
      const totalValue = nftCollections.reduce((sum, nft) => sum + nft.totalValueUsd, 0);
      return res.json({
        success: true,
        data: {
          collections: nftCollections,
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch NFT collections from sheets')
      );
    }
  });

  app.get("/api/sheets/dca", async (req, res) => {
    try {
      const dcaPortfolio = await fetchDcaPortfolio();
      const totalValue = dcaPortfolio.reduce((sum, token) => sum + token.usdValue, 0);
      return res.json({
        success: true,
        data: {
          tokens: dcaPortfolio,
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch DCA portfolio from sheets')
      );
    }
  });

  app.get("/api/sheets/tokens", async (req, res) => {
    try {
      const otherTokens = await fetchOtherTokens();
      const totalValue = otherTokens.reduce((sum, token) => sum + token.usdValue, 0);
      return res.json({
        success: true,
        data: {
          tokens: otherTokens,
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch other tokens from sheets')
      );
    }
  });

  app.get("/api/sheets/treasury-history", async (req, res) => {
    try {
      const history = await fetchTreasuryHistory();
      const chartData = history.map(row => ({
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: row.totalValueUsd,
        rawDate: row.date,
      }));
      return res.json({
        success: true,
        data: chartData,
      });
    } catch (error: any) {
      console.error('Error fetching treasury history:', error);
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch treasury history from sheets')
      );
    }
  });

  app.get("/api/sheets/dca-history", async (req, res) => {
    try {
      const history = await fetchDcaHistory();
      const chartData = history.map(row => ({
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: row.totalValueUsd,
        rawDate: row.date,
      }));
      return res.json({
        success: true,
        data: chartData,
      });
    } catch (error: any) {
      console.error('Error fetching DCA history:', error);
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch DCA history from sheets')
      );
    }
  });

  app.get("/api/sheets/multisig", async (req, res) => {
    try {
      const multiSigWallets = await fetchMultiSigWallets();
      const totalValue = multiSigWallets.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);
      return res.json({
        success: true,
        data: {
          wallets: multiSigWallets,
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch multi-sig wallets from sheets')
      );
    }
  });

  app.get("/api/sheets/dao-wallets", async (req, res) => {
    try {
      const daoWallets = await fetchDaoWallets();
      const totalValue = daoWallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);
      return res.json({
        success: true,
        data: {
          wallets: daoWallets.map(wallet => ({
            label: wallet.walletLabel,
            address: wallet.address,
            chain: wallet.chain,
            usdValue: wallet.usdValue,
          })),
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch DAO wallets from sheets')
      );
    }
  });

  app.get("/api/sheets/tactical", async (req, res) => {
    try {
      const tacticalWallets = await fetchTacticalWallets();
      const totalValue = tacticalWallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);
      return res.json({
        success: true,
        data: {
          wallets: tacticalWallets.map(wallet => ({
            label: wallet.walletLabel,
            address: wallet.address,
            chain: wallet.chain,
            primaryAsset: wallet.primaryAsset,
            balance: wallet.balance,
            usdValue: wallet.usdValue,
            purpose: wallet.purpose,
          })),
          totalValueUsd: totalValue,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch tactical wallets from sheets')
      );
    }
  });

  app.get("/api/snapshot/proposals", async (req, res) => {
    try {
      const proposals = await fetchSnapshotProposals();
      return res.json(proposals);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Snapshot proposals')
      );
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      return res.json(settings);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch settings')
      );
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: key and value',
        });
      }

      const setting = await storage.setAdminSetting({ key, value });
      return res.json(setting);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to update setting')
      );
    }
  });

  app.get("/api/discord/announcements", async (req, res) => {
    try {
      let adminSettings: any = null;
      try {
        const discordSettings = await storage.getAdminSetting('discord_config');
        adminSettings = discordSettings?.value;
      } catch (dbError) {
        console.log('Admin settings not available, using environment variables');
      }
      
      const settings = {
        enabled: adminSettings?.enabled ?? true,
        guildId: adminSettings?.guildId || process.env.DISCORD_GUILD_ID,
        channelId: adminSettings?.channelId || process.env.DISCORD_CHANNEL_ID,
      };
      
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const before = req.query.before as string | undefined;
      
      const announcements = await fetchDiscordAnnouncements(settings, limit, before);
      const isMock = !settings?.enabled || !settings?.guildId || !settings?.channelId;
      
      return res.json({
        data: announcements,
        isMock,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Discord announcements')
      );
    }
  });

  app.get("/api/treasury/snapshots", async (req, res) => {
    try {
      const cacheMaxAge = 5 * 60 * 1000;
      const cached = await getLatestSnapshot();
      
      if (cached && cached.timestamp) {
        const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
        if (cacheAge < cacheMaxAge) {
          console.log(`Returning cached snapshot (age: ${Math.floor(cacheAge / 1000)}s)`);
          return res.json(cached);
        }
      }

      console.log('Generating new treasury snapshot...');

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

      const priceMap = new Map(tokenPrices.map((p: { symbol: string; price: number }) => [p.symbol, p.price]));
      
      const tokenMap = new Map<string, any>();

      safeBalances.forEach((token: any) => {
        tokenMap.set(token.symbol, { ...token, source: 'safe' });
      });

      duneBalances.forEach((wallet: any) => {
        wallet.tokens.forEach((token: any) => {
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
        sheetData.dcaPortfolio.forEach((token: any) => {
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

        sheetData.otherTokens.forEach((token: any) => {
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

      allTokens.forEach((token: any) => {
        if (token.usdPrice && !token.usdValue) {
          token.usdValue = token.usdPrice * token.amount;
        }
      });

      const sheetsTotalValue = sheetData?.totals?.grandTotal || 0;
      const tokensTotalValue = allTokens.reduce((sum: number, token: any) => sum + (token.usdValue || 0), 0);
      const totalUsdValue = Math.max(tokensTotalValue, sheetsTotalValue);

      const walletsList: { address: string; label?: string; chainId?: number }[] = [];
      
      duneBalances.forEach((w: any) => {
        walletsList.push({ address: w.address, chainId: 1 });
      });

      if (sheetData) {
        sheetData.daoWallets.forEach((w: any) => {
          walletsList.push({ 
            address: w.address, 
            label: w.walletLabel, 
            chainId: w.chain === 'SOL' ? 101 : 1 
          });
        });
        sheetData.tacticalWallets.forEach((w: any) => {
          walletsList.push({ 
            address: w.address, 
            label: w.walletLabel, 
            chainId: w.chain === 'SOL' ? 101 : 1 
          });
        });
        sheetData.multiSigWallets.forEach((w: any) => {
          walletsList.push({ 
            address: w.address, 
            label: w.walletLabel, 
            chainId: 1 
          });
        });
      }

      const nftsList: any[] = [];
      if (sheetData?.nftCollections) {
        sheetData.nftCollections.forEach((nft: any) => {
          nftsList.push({
            collection: nft.collection,
            tokenId: nft.tokenId || '',
            estimatedValueUsd: nft.estimatedValueUsd,
            contractAddress: nft.contractAddress,
          });
        });
      }

      const snapshot = {
        timestamp: new Date().toISOString(),
        totalUsdValue,
        tokens: allTokens,
        nfts: nftsList,
        wallets: walletsList,
      };

      try {
        const saved = await upsertSnapshot(snapshot);
        console.log('Snapshot persisted to Supabase:', saved?.id);
      } catch (persistError) {
        console.error('Failed to persist snapshot, continuing with response:', persistError);
      }

      return res.json(snapshot);
    } catch (error: any) {
      const cached = await getLatestSnapshot();
      if (cached) {
        console.log('Returning stale cached snapshot due to error');
        return res.json(cached);
      }
      
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch treasury snapshot')
      );
    }
  });

  app.post("/api/treasury/snapshots", async (req, res) => {
    try {
      const snapshot = req.body;
      const result = await upsertSnapshot(snapshot);
      
      if (!result) {
        return res.status(500).json({
          success: false,
          message: 'Failed to save snapshot',
        });
      }

      const camelCaseResult = {
        id: result.id,
        timestamp: result.timestamp,
        totalUsdValue: result.total_usd_value,
        tokens: result.tokens,
        nfts: result.nfts,
        wallets: result.wallets,
        metadata: result.metadata,
      };
      
      return res.json({
        success: true,
        data: camelCaseResult,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to save snapshot')
      );
    }
  });

  app.get("/api/treasury/snapshots/history", async (req, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      
      const snapshots = await getHistoricalSnapshots(
        startDate as string | undefined,
        endDate as string | undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      
      return res.json(snapshots);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch historical snapshots')
      );
    }
  });

  app.get("/api/nfts/holdings", async (req, res) => {
    const { wallet, contract } = req.query;
    
    let walletsToFetch: string[];
    
    if (wallet) {
      walletsToFetch = [wallet as string];
    } else {
      const walletListSetting = await storage.getAdminSetting('treasury_wallets');
      const walletList = (walletListSetting?.value as string[]) || [];
      
      const safeAddress = process.env.SAFE_ADDRESS;
      const defaultWallets = safeAddress ? [safeAddress] : [];
      walletsToFetch = walletList.length > 0 ? walletList : defaultWallets;
    }
    
    if (walletsToFetch.length === 0) {
      console.warn('No treasury wallets configured, returning empty NFT list');
      return res.json([]);
    }

    try {
      const { fetchWalletNFTs } = await import('./lib/moralis');
      
      const allNfts: any[] = [];
      for (const walletAddr of walletsToFetch) {
        try {
          const walletNfts = await fetchWalletNFTs(walletAddr);
          allNfts.push(...walletNfts);
        } catch (walletError: any) {
          console.error(`Error fetching NFTs for wallet ${walletAddr}:`, walletError);
          if (walletError.message !== 'MORALIS_API_KEY_MISSING') {
            throw walletError;
          }
        }
      }

      if (allNfts.length > 0 && !wallet) {
        const nftAssetData = allNfts.map(nft => ({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          collection: nft.collection,
          image: nft.image || '',
          floorPrice: nft.floorPrice || 0,
          estimatedValueUsd: nft.estimatedValueUsd || 0,
        }));

        await storage.upsertNftAssets(nftAssetData);
      }
      
      const filteredNfts = contract 
        ? allNfts.filter(nft => nft.contractAddress?.toLowerCase() === (contract as string).toLowerCase())
        : allNfts;
      
      return res.json(filteredNfts);
    } catch (error: any) {
      if (wallet) {
        console.log('Wallet-specific query failed, returning empty array (cache is treasury-specific)');
        return res.json([]);
      }
      
      try {
        const cachedNfts = await storage.getNftAssets();
        console.log(`Returning ${cachedNfts.length} cached treasury NFTs due to API error`);
        
        const filteredCached = contract
          ? cachedNfts.filter(nft => nft.contractAddress?.toLowerCase() === (contract as string).toLowerCase())
          : cachedNfts;
        
        return res.json(filteredCached);
      } catch (cacheError) {
        console.error('Error fetching cached NFTs:', cacheError);
        return res.json([]);
      }
    }
  });

  app.get("/api/export/csv", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const snapshots = await getHistoricalSnapshots(
        startDate as string | undefined,
        endDate as string | undefined
      );

      const csvData = generateCsvData(snapshots);
      
      const filename = `treasury-export-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to generate CSV export')
      );
    }
  });

  app.get("/api/export/pdf", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const snapshots = await getHistoricalSnapshots(
        startDate as string | undefined,
        endDate as string | undefined
      );

      const pdfBuffer = await generatePdfReport(snapshots);
      
      const filename = `treasury-report-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to generate PDF report')
      );
    }
  });

  app.get("/api/community/messages", async (req, res) => {
    try {
      const channel = (req.query.channel as string) || 'general';
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await storage.getCommunityMessages(channel, limit, offset);
      
      return res.json({
        success: true,
        data: messages,
        pagination: {
          limit,
          offset,
          channel,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch community messages')
      );
    }
  });

  app.post("/api/community/messages", async (req, res) => {
    try {
      const validationResult = insertCommunityMessageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid message data',
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const { walletAddress, message, channel, username } = validationResult.data;
      const targetChannel = channel;

      const isHolder = await isKongHolder(walletAddress);
      if (!isHolder) {
        return res.status(403).json({
          success: false,
          message: 'Only Kong NFT holders can post messages',
        });
      }

      const lastMessage = await storage.getLastMessageByWallet(walletAddress, targetChannel);
      if (lastMessage) {
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        if (lastMessage.createdAt > thirtySecondsAgo) {
          const waitTime = Math.ceil((lastMessage.createdAt.getTime() + 30000 - Date.now()) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${waitTime} seconds before posting again`,
            retryAfter: waitTime,
          });
        }
      }

      const newMessage = await storage.createCommunityMessage({
        walletAddress,
        message,
        channel: targetChannel,
        username: username || undefined,
      });

      if (io) {
        io.emit('community:new-message', {
          channel: newMessage.channel,
          message: newMessage,
        });
      }

      return res.status(201).json({
        success: true,
        data: newMessage,
      });
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'rate_limit_unique') {
        return res.status(429).json({
          success: false,
          message: 'You are posting too quickly. Please wait 30 seconds between messages.',
          retryAfter: 30,
        });
      }
      
      return res.status(500).json(
        createErrorResponse(error, 'Failed to post message')
      );
    }
  });

  // Community Members - Member info capture
  app.post("/api/community/members", async (req, res) => {
    try {
      const validationResult = insertCommunityMemberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid member data',
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const { walletAddress } = validationResult.data;

      // Verify Kong NFT ownership
      const isHolder = await isKongHolder(walletAddress);
      if (!isHolder) {
        return res.status(403).json({
          success: false,
          message: 'Only Kong NFT holders can register as community members',
        });
      }

      // TODO: Persist this to Supabase or production database:
      // create table community_members (
      //   id uuid primary key default uuid_generate_v4(),
      //   wallet_address text unique not null,
      //   email text,
      //   display_name text,
      //   discord_handle text,
      //   country text,
      //   created_at timestamptz default now(),
      //   updated_at timestamptz default now()
      // );

      const member = await storage.createOrUpdateCommunityMember(validationResult.data);

      return res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to save member information')
      );
    }
  });

  app.get("/api/safe/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllSafeAccounts();
      return res.json({
        success: true,
        data: accounts,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Safe accounts')
      );
    }
  });

  app.get("/api/safe/info/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { chainId } = req.query;

      const parsedChainId = chainId ? parseInt(chainId as string) : 1;
      const safeService = new SafeService(parsedChainId);
      const safeInfo = await safeService.getSafeInfo(address, parsedChainId);

      await storage.createOrUpdateSafeAccount({
        safeAddress: safeInfo.address,
        chainId: safeInfo.chainId,
        threshold: safeInfo.threshold,
        owners: safeInfo.owners,
        version: safeInfo.version,
      });

      return res.json({
        success: true,
        data: safeInfo,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Safe info')
      );
    }
  });

  app.post("/api/safe/propose-transaction", requireAdmin, async (req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Transaction proposal requires Safe Protocol Kit configuration. This endpoint is currently disabled. Use the Safe web interface for transaction creation.',
    });
  });

  app.post("/api/safe/sign-transaction", requireAdmin, async (req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Transaction signing requires Safe Protocol Kit configuration. This endpoint is currently disabled. Use the Safe web interface for signing transactions.',
    });
  });

  app.post("/api/safe/execute-transaction", requireAdmin, async (req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Transaction execution requires Safe Protocol Kit configuration. This endpoint is currently disabled. Use the Safe web interface for executing transactions.',
    });
  });

  app.get("/api/safe/transactions/:safeAddress", async (req, res) => {
    try {
      const { safeAddress } = req.params;
      const { pending } = req.query;

      const transactions = pending === 'true' 
        ? await storage.getPendingSafeTransactions(safeAddress)
        : await storage.getAllSafeTransactions(safeAddress);

      return res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch transactions')
      );
    }
  });

  app.get("/api/safe/balances/:safeAddress", async (req, res) => {
    try {
      const { safeAddress } = req.params;
      const { chainId } = req.query;

      const parsedChainId = chainId ? parseInt(chainId as string) : 1;
      const safeService = new SafeService(parsedChainId);
      const balances = await safeService.getSafeBalances(safeAddress, parsedChainId);

      const formatted = safeService.formatBalancesForDisplay(balances, parsedChainId);

      return res.json({
        success: true,
        data: formatted,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Safe balances')
      );
    }
  });

  app.get("/api/safe/all-wallets", async (req, res) => {
    try {
      const { getAllConfiguredSafeWallets } = await import('@shared/safeWallets');
      const configuredWallets = getAllConfiguredSafeWallets();

      if (configuredWallets.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No Safe wallet addresses configured',
        });
      }

      const safeService = new SafeService();
      const walletsData = await safeService.getMultipleWalletsBalances(configuredWallets);

      const totalValue = walletsData.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);

      return res.json({
        success: true,
        data: {
          wallets: walletsData,
          totalUsdValue: totalValue,
          walletsCount: walletsData.length,
        },
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch all Safe wallets')
      );
    }
  });

  app.get("/api/safe/transactions/pending/:safeAddress", async (req, res) => {
    try {
      const { safeAddress } = req.params;
      const { chainId } = req.query;

      const safeService = new SafeService(chainId ? parseInt(chainId as string) : 1);
      const pendingTxs = await safeService.getPendingTransactions(
        safeAddress,
        chainId ? parseInt(chainId as string) : 1
      );

      return res.json({
        success: true,
        data: pendingTxs,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch pending transactions')
      );
    }
  });

  app.get("/api/safe/transactions/history/:safeAddress", async (req, res) => {
    try {
      const { safeAddress } = req.params;
      const { chainId, limit } = req.query;

      const safeService = new SafeService(chainId ? parseInt(chainId as string) : 1);
      const history = await safeService.getTransactionHistory(
        safeAddress,
        chainId ? parseInt(chainId as string) : 1,
        limit ? parseInt(limit as string) : 20
      );

      return res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch transaction history')
      );
    }
  });

  app.get("/api/safe/transaction/:safeTxHash", async (req, res) => {
    try {
      const { safeTxHash } = req.params;
      const { chainId } = req.query;

      const safeService = new SafeService(chainId ? parseInt(chainId as string) : 1);
      const transaction = await safeService.getTransaction(
        safeTxHash,
        chainId ? parseInt(chainId as string) : 1
      );

      return res.json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch transaction')
      );
    }
  });

  app.get("/api/safe/confirmations/:safeTxHash", async (req, res) => {
    try {
      const { safeTxHash } = req.params;
      const { chainId } = req.query;

      const safeService = new SafeService(chainId ? parseInt(chainId as string) : 1);
      const confirmations = await safeService.getTransactionConfirmations(
        safeTxHash,
        chainId ? parseInt(chainId as string) : 1
      );

      return res.json({
        success: true,
        data: confirmations,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch confirmations')
      );
    }
  });

  app.get("/api/safe/safes-by-owner/:ownerAddress", async (req, res) => {
    try {
      const { ownerAddress } = req.params;
      const { chainId } = req.query;

      const safeService = new SafeService(chainId ? parseInt(chainId as string) : 1);
      const safes = await safeService.getSafesByOwner(
        ownerAddress,
        chainId ? parseInt(chainId as string) : 1
      );

      return res.json({
        success: true,
        data: safes,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch Safes by owner')
      );
    }
  });

  // Kong NFT Holdings Endpoints
  app.get("/api/kong-nfts/total-dao-holdings", async (req, res) => {
    try {
      const holdings = await kongNftService.getTotalDaoHoldings();

      return res.json({
        success: true,
        data: holdings,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to fetch total DAO Kong NFT holdings')
      );
    }
  });

  // Admin Data Export Endpoints
  app.get("/api/admin/export/messages", requireAdmin, async (req, res) => {
    try {
      const format = (req.query.format as string) || 'json';
      const channel = req.query.channel as string;
      
      const allMessages = [];
      const channels = channel ? [channel] : ['general', 'treasury', 'governance'];
      
      for (const ch of channels) {
        const messages = await storage.getCommunityMessages(ch, 1000, 0);
        allMessages.push(...messages);
      }
      
      allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (format === 'csv') {
        const headers = ['id', 'wallet_address', 'username', 'message', 'channel', 'created_at'];
        const csvRows = [headers.join(',')];
        
        for (const msg of allMessages) {
          const row = [
            msg.id,
            msg.walletAddress,
            msg.username || '',
            `"${(msg.message || '').replace(/"/g, '""')}"`,
            msg.channel,
            msg.createdAt,
          ];
          csvRows.push(row.join(','));
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=community_messages.csv');
        return res.send(csvRows.join('\n'));
      }
      
      return res.json({
        success: true,
        count: allMessages.length,
        data: allMessages,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to export messages')
      );
    }
  });

  app.get("/api/admin/export/members", requireAdmin, async (req, res) => {
    try {
      const format = (req.query.format as string) || 'json';
      
      const members = await storage.getAllCommunityMembers();
      
      if (format === 'csv') {
        const headers = ['id', 'wallet_address', 'display_name', 'discord_handle', 'email', 'country', 'created_at'];
        const csvRows = [headers.join(',')];
        
        for (const member of members) {
          const row = [
            member.id,
            member.walletAddress,
            `"${(member.displayName || '').replace(/"/g, '""')}"`,
            `"${(member.discordHandle || '').replace(/"/g, '""')}"`,
            member.email || '',
            member.country || '',
            member.createdAt,
          ];
          csvRows.push(row.join(','));
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=community_members.csv');
        return res.send(csvRows.join('\n'));
      }
      
      return res.json({
        success: true,
        count: members.length,
        data: members,
      });
    } catch (error: any) {
      return res.status(500).json(
        createErrorResponse(error, 'Failed to export members')
      );
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

export function initializeSocketIO(server: Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.IO initialized');
}
