/**
 * Centralized exports for shared types, constants, and data
 * Use: import { TreasurySnapshot, daoWallets } from '@shared'
 * Note: Kong NFT contract address is now environment-variable only (BETTING_KONGS_TOKEN_CONTRACT_ADDRESS)
 */

export type { TreasurySnapshot, TokenBalance, NftHolding } from './treasury-types';

export { 
  SNAPSHOT_SPACE, 
  SNAPSHOT_HUB_URL,
  CHAIN_IDS,
  EXPLORERS,
  SUPPORTED_CHAINS,
  ERC721_ABI 
} from './constants';

export { daoWallets, dcaPortfolio, otherTreasuryTokens } from './daoWallets';
export type { DaoWallet, DaoWalletGroups, TokenHolding, Chain } from './daoWallets';

export { daoNftCollections } from './daoNfts';
export type { DaoNftCollection } from './daoNfts';

export { SAFE_WALLETS, getSafeWalletAddress, getAllConfiguredSafeWallets } from './safeWallets';
export type { SafeWalletConfig } from './safeWallets';
