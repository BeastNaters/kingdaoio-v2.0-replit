import { isValidEthAddress } from './lib/validators';

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    errors.push('DATABASE_URL is required but not set');
  } else if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)');
  }

  const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com';
  if (!ETHEREUM_RPC_URL) {
    errors.push('ETHEREUM_RPC_URL or NEXT_PUBLIC_RPC_URL is required for Kong NFT holder verification');
  } else {
    try {
      new URL(ETHEREUM_RPC_URL);
      if (!process.env.ETHEREUM_RPC_URL && !process.env.NEXT_PUBLIC_RPC_URL) {
        warnings.push('ETHEREUM_RPC_URL not set - using default public RPC endpoint (https://eth.llamarpc.com). For better performance, set your own RPC URL.');
      }
    } catch {
      errors.push('ETHEREUM_RPC_URL must be a valid URL');
    }
  }

  const ADMIN_ADDRESSES = process.env.ADMIN_ADDRESSES;
  if (!ADMIN_ADDRESSES || ADMIN_ADDRESSES.trim() === '') {
    warnings.push('ADMIN_ADDRESSES not set - admin features will be disabled. Set this to enable admin panel access.');
  } else {
    const addresses = ADMIN_ADDRESSES.split(',').map(addr => addr.trim());
    const invalidAddresses = addresses.filter(addr => !isValidEthAddress(addr));
    if (invalidAddresses.length > 0) {
      errors.push(`Invalid admin addresses: ${invalidAddresses.join(', ')}`);
    }
  }

  // Kong NFT Contract Address (Required for token gating)
  const KONG_CONTRACT = process.env.BETTING_KONGS_TOKEN_CONTRACT_ADDRESS;
  if (!KONG_CONTRACT) {
    errors.push('BETTING_KONGS_TOKEN_CONTRACT_ADDRESS is required for NFT holder verification');
  } else if (!isValidEthAddress(KONG_CONTRACT)) {
    errors.push('BETTING_KONGS_TOKEN_CONTRACT_ADDRESS must be a valid Ethereum address');
  }

  // Multiple Safe wallet addresses (all optional but validate if set)
  const SAFE_DAO_FUND = process.env.SAFE_DAO_FUND_ADDRESS_ETH;
  if (SAFE_DAO_FUND && !isValidEthAddress(SAFE_DAO_FUND)) {
    warnings.push('SAFE_DAO_FUND_ADDRESS_ETH is set but not a valid Ethereum address');
  }

  const SAFE_REWARD = process.env.SAFE_REWARD_WALLET_ADDRESS;
  if (SAFE_REWARD && !isValidEthAddress(SAFE_REWARD)) {
    warnings.push('SAFE_REWARD_WALLET_ADDRESS is set but not a valid Ethereum address');
  }

  const SAFE_DCAP = process.env.SAFE_DCAP_WALLET_ADDRESS;
  if (SAFE_DCAP && !isValidEthAddress(SAFE_DCAP)) {
    warnings.push('SAFE_DCAP_WALLET_ADDRESS is set but not a valid Ethereum address');
  }

  // Warn if no Safe wallets configured
  if (!SAFE_DAO_FUND && !SAFE_REWARD && !SAFE_DCAP) {
    warnings.push('No Safe wallet addresses configured - multi-sig wallet features will use mock data');
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const supabaseVarsPresent = [
    SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY
  ].filter(Boolean).length;

  if (supabaseVarsPresent > 0 && supabaseVarsPresent < 3) {
    warnings.push(
      'Partial Supabase configuration detected. For full functionality, set: ' +
      'SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY && supabaseVarsPresent === 0) {
    warnings.push('Supabase not configured - treasury snapshots and caching will be disabled');
  }

  const DUNE_API_KEY = process.env.DUNE_API_KEY;
  if (!DUNE_API_KEY) {
    warnings.push('DUNE_API_KEY not set - NFT floor prices will use mock data');
  }

  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  if (!MORALIS_API_KEY) {
    warnings.push('MORALIS_API_KEY not set - some blockchain data features may use mock data');
  }

  const TREASURY_SPREADSHEET_ID = process.env.TREASURY_SPREADSHEET_ID;
  if (!TREASURY_SPREADSHEET_ID) {
    warnings.push('TREASURY_SPREADSHEET_ID not set - Google Sheets integration disabled');
  }

  const SAFE_TX_SERVICE_URL = process.env.SAFE_TX_SERVICE_URL;
  if (SAFE_TX_SERVICE_URL) {
    try {
      new URL(SAFE_TX_SERVICE_URL);
    } catch {
      warnings.push('SAFE_TX_SERVICE_URL is set but not a valid URL');
    }
  }

  const SNAPSHOT_INTERVAL = process.env.SNAPSHOT_INTERVAL;
  if (SNAPSHOT_INTERVAL) {
    const intervalNum = parseInt(SNAPSHOT_INTERVAL, 10);
    if (isNaN(intervalNum) || intervalNum < 60000) {
      warnings.push('SNAPSHOT_INTERVAL should be >= 60000 (1 minute) in milliseconds');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logValidationResults(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Variable Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All environment variables validated successfully');
  }
}

export function exitIfInvalid(result: EnvValidationResult): void {
  if (!result.valid) {
    console.error('\n🛑 Server startup aborted due to invalid environment configuration');
    console.error('Please check .env.example for required variables\n');
    process.exit(1);
  }
}
