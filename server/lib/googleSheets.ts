import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.TREASURY_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('TREASURY_SPREADSHEET_ID not configured');
  }
  return spreadsheetId;
}

export interface NftCollectionRow {
  collection: string;
  description: string;
  contractAddress: string;
  quantity: number;
  floorPriceEth: number;
  totalValueUsd: number;
  openseaLink: string;
}

export async function fetchNftCollections(): Promise<NftCollectionRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'NFT_Collections!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        collection: row[0] || '',
        description: row[1] || '',
        contractAddress: row[2] || '',
        quantity: parseInt(row[3]) || 0,
        floorPriceEth: parseFloat(row[4]) || 0,
        totalValueUsd: parseFloat(row[5]) || 0,
        openseaLink: row[6] || '',
      }));
  } catch (error) {
    console.error('Error fetching NFT Collections:', error);
    throw error;
  }
}

export interface DcaTokenRow {
  token: string;
  amount: number;
  priceUsd: number;
  usdValue: number;
  notes: string;
}

export async function fetchDcaPortfolio(): Promise<DcaTokenRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DCA_Portfolio!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        token: row[0] || '',
        amount: parseFloat(row[1]) || 0,
        priceUsd: parseFloat(row[2]) || 0,
        usdValue: parseFloat(row[3]) || 0,
        notes: row[4] || '',
      }));
  } catch (error) {
    console.error('Error fetching DCA Portfolio:', error);
    throw error;
  }
}

export interface OtherTokenRow {
  token: string;
  amount: number;
  priceUsd: number;
  usdValue: number;
  wallet: string;
}

export async function fetchOtherTokens(): Promise<OtherTokenRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Other_Tokens!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        token: row[0] || '',
        amount: parseFloat(row[1]) || 0,
        priceUsd: parseFloat(row[2]) || 0,
        usdValue: parseFloat(row[3]) || 0,
        wallet: row[4] || '',
      }));
  } catch (error) {
    console.error('Error fetching Other Tokens:', error);
    throw error;
  }
}

export interface MultiSigWalletRow {
  walletName: string;
  description: string;
  address: string;
  chain: string;
  category: string;
  totalUsdValue: number;
  lastUpdated: string;
}

export async function fetchMultiSigWallets(): Promise<MultiSigWalletRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MultiSig_Wallets!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        walletName: row[0] || '',
        description: row[1] || '',
        address: row[2] || '',
        chain: row[3] || 'ETH',
        category: row[4] || '',
        totalUsdValue: parseFloat(row[5]) || 0,
        lastUpdated: row[6] || '',
      }));
  } catch (error) {
    console.error('Error fetching MultiSig Wallets:', error);
    throw error;
  }
}

export interface DaoWalletRow {
  walletLabel: string;
  address: string;
  chain: string;
  usdValue: number;
}

export async function fetchDaoWallets(): Promise<DaoWalletRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DAO_Wallets!A:D',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        walletLabel: row[0] || '',
        address: row[1] || '',
        chain: row[2] || 'ETH',
        usdValue: parseFloat(row[3]) || 0,
      }));
  } catch (error) {
    console.error('Error fetching DAO Wallets:', error);
    throw error;
  }
}

export interface TacticalWalletRow {
  walletLabel: string;
  address: string;
  chain: string;
  primaryAsset: string;
  balance: number;
  usdValue: number;
  purpose: string;
}

export async function fetchTacticalWallets(): Promise<TacticalWalletRow[]> {
  const spreadsheetId = getSpreadsheetId();
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Tactical_Wallets!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const [, ...dataRows] = rows;
    
    return dataRows
      .filter(row => row[0])
      .map((row) => ({
        walletLabel: row[0] || '',
        address: row[1] || '',
        chain: row[2] || 'ETH',
        primaryAsset: row[3] || '',
        balance: parseFloat(row[4]) || 0,
        usdValue: parseFloat(row[5]) || 0,
        purpose: row[6] || '',
      }));
  } catch (error) {
    console.error('Error fetching Tactical Wallets:', error);
    throw error;
  }
}

export async function fetchAllTreasuryData() {
  const [nftCollections, dcaPortfolio, otherTokens, multiSigWallets, daoWallets, tacticalWallets] = await Promise.all([
    fetchNftCollections().catch(() => []),
    fetchDcaPortfolio().catch(() => []),
    fetchOtherTokens().catch(() => []),
    fetchMultiSigWallets().catch(() => []),
    fetchDaoWallets().catch(() => []),
    fetchTacticalWallets().catch(() => []),
  ]);

  const nftTotal = nftCollections.reduce((sum, nft) => sum + nft.totalValueUsd, 0);
  const dcaTotal = dcaPortfolio.reduce((sum, token) => sum + token.usdValue, 0);
  const otherTokensTotal = otherTokens.reduce((sum, token) => sum + token.usdValue, 0);
  const multiSigTotal = multiSigWallets.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);
  const daoWalletsTotal = daoWallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);
  const tacticalTotal = tacticalWallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);

  return {
    nftCollections,
    dcaPortfolio,
    otherTokens,
    multiSigWallets,
    daoWallets,
    tacticalWallets,
    totals: {
      nft: nftTotal,
      dca: dcaTotal,
      otherTokens: otherTokensTotal,
      multiSig: multiSigTotal,
      daoWallets: daoWalletsTotal,
      tactical: tacticalTotal,
      grandTotal: nftTotal + dcaTotal + otherTokensTotal + multiSigTotal + daoWalletsTotal + tacticalTotal,
    },
  };
}
