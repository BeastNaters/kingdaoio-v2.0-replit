import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, unique, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const nftAssets = pgTable("nft_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  collection: text("collection").notNull(),
  image: text("image"),
  floorPrice: real("floor_price"),
  estimatedValueUsd: real("estimated_value_usd"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
}, (table) => ({
  contractTokenUnique: unique("contract_token_unique").on(table.contractAddress, table.tokenId),
}));

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertNftAssetSchema = createInsertSchema(nftAssets).omit({
  id: true,
  lastUpdated: true,
});

export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

export type InsertNftAsset = z.infer<typeof insertNftAssetSchema>;
export type NftAsset = typeof nftAssets.$inferSelect;

export interface TokenBalance {
  symbol: string;
  amount: number;
  usdPrice?: number;
  usdValue?: number;
  source: 'safe' | 'dune' | 'manual';
}

export interface NftHolding {
  collection: string;
  tokenId: string;
  image?: string;
  floorPrice?: number;
  estimatedValueUsd?: number;
}

export interface WalletInfo {
  address: string;
  chainId: number;
}

export interface SnapshotData {
  timestamp: string;
  totalUsdValue: number;
  tokens: TokenBalance[];
  nfts: NftHolding[];
  wallets: WalletInfo[];
}

export const communityMessages = pgTable("community_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  username: text("username"),
  message: text("message").notNull(),
  channel: text("channel").notNull().default("general"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  windowSlot: text("window_slot").notNull().generatedAlwaysAs(sql`floor(extract(epoch from created_at) / 30)::text`),
}, (table) => ({
  rateLimitUnique: unique("rate_limit_unique").on(table.walletAddress, table.channel, table.windowSlot),
}));

export const insertCommunityMessageSchema = createInsertSchema(communityMessages).omit({
  id: true,
  createdAt: true,
  windowSlot: true,
}).extend({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long (max 1000 characters)"),
  channel: z.string().min(1).max(50).default("general"),
  username: z.string().max(50).optional(),
});

export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type CommunityMessage = typeof communityMessages.$inferSelect;

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  discordHandle: text("discord_handle"),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  displayName: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  discordHandle: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  country: z.string().trim().min(1).max(100).optional().or(z.literal("")),
}).refine((data) => {
  const hasEmail = data.email && data.email.trim().length > 0;
  const hasName = data.displayName && data.displayName.trim().length > 0;
  const hasDiscord = data.discordHandle && data.discordHandle.trim().length > 0;
  return hasEmail || hasName || hasDiscord;
}, {
  message: "At least one of email, display name, or Discord handle is required",
  path: ["email"],
});

export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;

export const safeAccounts = pgTable("safe_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safeAddress: text("safe_address").notNull().unique(),
  chainId: integer("chain_id").notNull(),
  threshold: integer("threshold").notNull(),
  owners: text("owners").array().notNull(),
  version: text("version"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const safeTransactions = pgTable("safe_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safeAddress: text("safe_address").notNull(),
  safeTxHash: text("safe_tx_hash").notNull().unique(),
  to: text("to").notNull(),
  value: text("value").notNull(),
  data: text("data"),
  operation: integer("operation").notNull().default(0),
  nonce: integer("nonce").notNull(),
  safeTxGas: text("safe_tx_gas").notNull(),
  baseGas: text("base_gas").notNull(),
  gasPrice: text("gas_price").notNull(),
  gasToken: text("gas_token"),
  refundReceiver: text("refund_receiver"),
  description: text("description"),
  chainId: integer("chain_id").notNull(),
  status: text("status").notNull().default('pending'),
  confirmationsRequired: integer("confirmations_required").notNull(),
  confirmationsCount: integer("confirmations_count").notNull().default(0),
  transactionHash: text("transaction_hash"),
  executedAt: timestamp("executed_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const safeConfirmations = pgTable("safe_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safeTxHash: text("safe_tx_hash").notNull(),
  owner: text("owner").notNull(),
  signature: text("signature").notNull(),
  signatureType: text("signature_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  txOwnerUnique: unique("tx_owner_unique").on(table.safeTxHash, table.owner),
}));

export const insertSafeAccountSchema = createInsertSchema(safeAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  safeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
  chainId: z.number().int().positive(),
  threshold: z.number().int().positive(),
  owners: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1),
});

export const insertSafeTransactionSchema = createInsertSchema(safeTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmationsCount: true,
  executedAt: true,
  transactionHash: true,
}).extend({
  safeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid recipient address"),
  value: z.string(),
  chainId: z.number().int().positive(),
  nonce: z.number().int().min(0),
  status: z.enum(['pending', 'executed', 'failed', 'cancelled']).default('pending'),
  createdBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator address"),
});

export const insertSafeConfirmationSchema = createInsertSchema(safeConfirmations).omit({
  id: true,
  createdAt: true,
}).extend({
  safeTxHash: z.string().min(1),
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid owner address"),
  signature: z.string().min(1),
});

export type InsertSafeAccount = z.infer<typeof insertSafeAccountSchema>;
export type SafeAccount = typeof safeAccounts.$inferSelect;

export type InsertSafeTransaction = z.infer<typeof insertSafeTransactionSchema>;
export type SafeTransaction = typeof safeTransactions.$inferSelect;

export type InsertSafeConfirmation = z.infer<typeof insertSafeConfirmationSchema>;
export type SafeConfirmation = typeof safeConfirmations.$inferSelect;

export interface SafeTransactionWithConfirmations extends SafeTransaction {
  confirmations: SafeConfirmation[];
}
