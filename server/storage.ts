import { 
  type AdminSetting,
  type InsertAdminSetting,
  type NftAsset,
  type InsertNftAsset,
  type CommunityMessage,
  type InsertCommunityMessage,
  type CommunityMember,
  type InsertCommunityMember,
  type SafeAccount,
  type InsertSafeAccount,
  type SafeTransaction,
  type InsertSafeTransaction,
  type SafeConfirmation,
  type InsertSafeConfirmation,
  type SafeTransactionWithConfirmations
} from "@shared/schema";
import { db } from "./db";
import { adminSettings, nftAssets, communityMessages, communityMembers, safeAccounts, safeTransactions, safeConfirmations } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
  
  getNftAssets(): Promise<NftAsset[]>;
  getNftAsset(contractAddress: string, tokenId: string): Promise<NftAsset | undefined>;
  upsertNftAsset(asset: InsertNftAsset): Promise<NftAsset>;
  upsertNftAssets(assets: InsertNftAsset[]): Promise<NftAsset[]>;

  getCommunityMessages(channel: string, limit: number, offset: number): Promise<CommunityMessage[]>;
  getLastMessageByWallet(walletAddress: string, channel: string): Promise<CommunityMessage | undefined>;
  createCommunityMessage(message: InsertCommunityMessage): Promise<CommunityMessage>;

  getCommunityMember(walletAddress: string): Promise<CommunityMember | undefined>;
  createOrUpdateCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;

  getSafeAccount(safeAddress: string): Promise<SafeAccount | undefined>;
  createOrUpdateSafeAccount(account: InsertSafeAccount): Promise<SafeAccount>;
  getAllSafeAccounts(): Promise<SafeAccount[]>;

  getSafeTransaction(safeTxHash: string): Promise<SafeTransaction | undefined>;
  getSafeTransactionWithConfirmations(safeTxHash: string): Promise<SafeTransactionWithConfirmations | undefined>;
  createSafeTransaction(transaction: InsertSafeTransaction): Promise<SafeTransaction>;
  updateSafeTransaction(safeTxHash: string, updates: Partial<SafeTransaction>): Promise<SafeTransaction>;
  getPendingSafeTransactions(safeAddress: string): Promise<SafeTransactionWithConfirmations[]>;
  getAllSafeTransactions(safeAddress: string): Promise<SafeTransactionWithConfirmations[]>;

  getSafeConfirmation(safeTxHash: string, owner: string): Promise<SafeConfirmation | undefined>;
  createSafeConfirmation(confirmation: InsertSafeConfirmation): Promise<SafeConfirmation>;
  getSafeConfirmations(safeTxHash: string): Promise<SafeConfirmation[]>;
}

export class DatabaseStorage implements IStorage {
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting || undefined;
  }

  async setAdminSetting(insertSetting: InsertAdminSetting): Promise<AdminSetting> {
    const [setting] = await db
      .insert(adminSettings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: {
          value: insertSetting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  async getNftAssets(): Promise<NftAsset[]> {
    return await db.select().from(nftAssets);
  }

  async getNftAsset(contractAddress: string, tokenId: string): Promise<NftAsset | undefined> {
    const [asset] = await db
      .select()
      .from(nftAssets)
      .where(and(
        eq(nftAssets.contractAddress, contractAddress),
        eq(nftAssets.tokenId, tokenId)
      ));
    return asset || undefined;
  }

  async upsertNftAsset(insertAsset: InsertNftAsset): Promise<NftAsset> {
    const [asset] = await db
      .insert(nftAssets)
      .values(insertAsset)
      .onConflictDoUpdate({
        target: [nftAssets.contractAddress, nftAssets.tokenId],
        set: {
          collection: insertAsset.collection,
          image: insertAsset.image,
          floorPrice: insertAsset.floorPrice,
          estimatedValueUsd: insertAsset.estimatedValueUsd,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return asset;
  }

  async upsertNftAssets(assets: InsertNftAsset[]): Promise<NftAsset[]> {
    if (assets.length === 0) return [];
    
    const results: NftAsset[] = [];
    for (const asset of assets) {
      const result = await this.upsertNftAsset(asset);
      results.push(result);
    }
    return results;
  }

  async getCommunityMessages(channel: string, limit: number, offset: number): Promise<CommunityMessage[]> {
    const messages = await db
      .select()
      .from(communityMessages)
      .where(eq(communityMessages.channel, channel))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit)
      .offset(offset);
    return messages.reverse();
  }

  async getLastMessageByWallet(walletAddress: string, channel: string): Promise<CommunityMessage | undefined> {
    const [message] = await db
      .select()
      .from(communityMessages)
      .where(and(
        eq(communityMessages.walletAddress, walletAddress),
        eq(communityMessages.channel, channel)
      ))
      .orderBy(desc(communityMessages.createdAt))
      .limit(1);
    return message || undefined;
  }

  async createCommunityMessage(insertMessage: InsertCommunityMessage): Promise<CommunityMessage> {
    const [message] = await db
      .insert(communityMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getCommunityMember(walletAddress: string): Promise<CommunityMember | undefined> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.walletAddress, walletAddress));
    return member || undefined;
  }

  async createOrUpdateCommunityMember(insertMember: InsertCommunityMember): Promise<CommunityMember> {
    const existing = await this.getCommunityMember(insertMember.walletAddress);
    
    const updateData = {
      email: insertMember.email || (existing?.email) || null,
      displayName: insertMember.displayName || (existing?.displayName) || null,
      discordHandle: insertMember.discordHandle || (existing?.discordHandle) || null,
      country: insertMember.country || (existing?.country) || null,
    };

    const [member] = await db
      .insert(communityMembers)
      .values({
        ...insertMember,
        ...updateData,
      })
      .onConflictDoUpdate({
        target: communityMembers.walletAddress,
        set: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return member;
  }

  async getSafeAccount(safeAddress: string): Promise<SafeAccount | undefined> {
    const [account] = await db
      .select()
      .from(safeAccounts)
      .where(eq(safeAccounts.safeAddress, safeAddress));
    return account || undefined;
  }

  async createOrUpdateSafeAccount(insertAccount: InsertSafeAccount): Promise<SafeAccount> {
    const [account] = await db
      .insert(safeAccounts)
      .values(insertAccount)
      .onConflictDoUpdate({
        target: safeAccounts.safeAddress,
        set: {
          chainId: insertAccount.chainId,
          threshold: insertAccount.threshold,
          owners: insertAccount.owners,
          version: insertAccount.version,
          updatedAt: new Date(),
        },
      })
      .returning();
    return account;
  }

  async getAllSafeAccounts(): Promise<SafeAccount[]> {
    return await db.select().from(safeAccounts);
  }

  async getSafeTransaction(safeTxHash: string): Promise<SafeTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(safeTransactions)
      .where(eq(safeTransactions.safeTxHash, safeTxHash));
    return transaction || undefined;
  }

  async getSafeTransactionWithConfirmations(safeTxHash: string): Promise<SafeTransactionWithConfirmations | undefined> {
    const transaction = await this.getSafeTransaction(safeTxHash);
    if (!transaction) return undefined;

    const confirmations = await this.getSafeConfirmations(safeTxHash);
    
    return {
      ...transaction,
      confirmations,
    };
  }

  async createSafeTransaction(insertTransaction: InsertSafeTransaction): Promise<SafeTransaction> {
    const [transaction] = await db
      .insert(safeTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateSafeTransaction(safeTxHash: string, updates: Partial<SafeTransaction>): Promise<SafeTransaction> {
    const [transaction] = await db
      .update(safeTransactions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(safeTransactions.safeTxHash, safeTxHash))
      .returning();
    return transaction;
  }

  async getPendingSafeTransactions(safeAddress: string): Promise<SafeTransactionWithConfirmations[]> {
    const transactions = await db
      .select()
      .from(safeTransactions)
      .where(and(
        eq(safeTransactions.safeAddress, safeAddress),
        eq(safeTransactions.status, 'pending')
      ))
      .orderBy(desc(safeTransactions.createdAt));

    const txsWithConfirmations = await Promise.all(
      transactions.map(async (tx) => {
        const confirmations = await this.getSafeConfirmations(tx.safeTxHash);
        return {
          ...tx,
          confirmations,
        };
      })
    );

    return txsWithConfirmations;
  }

  async getAllSafeTransactions(safeAddress: string): Promise<SafeTransactionWithConfirmations[]> {
    const transactions = await db
      .select()
      .from(safeTransactions)
      .where(eq(safeTransactions.safeAddress, safeAddress))
      .orderBy(desc(safeTransactions.createdAt));

    const txsWithConfirmations = await Promise.all(
      transactions.map(async (tx) => {
        const confirmations = await this.getSafeConfirmations(tx.safeTxHash);
        return {
          ...tx,
          confirmations,
        };
      })
    );

    return txsWithConfirmations;
  }

  async getSafeConfirmation(safeTxHash: string, owner: string): Promise<SafeConfirmation | undefined> {
    const [confirmation] = await db
      .select()
      .from(safeConfirmations)
      .where(and(
        eq(safeConfirmations.safeTxHash, safeTxHash),
        eq(safeConfirmations.owner, owner)
      ));
    return confirmation || undefined;
  }

  async createSafeConfirmation(insertConfirmation: InsertSafeConfirmation): Promise<SafeConfirmation> {
    const [confirmation] = await db
      .insert(safeConfirmations)
      .values(insertConfirmation)
      .returning();
    return confirmation;
  }

  async getSafeConfirmations(safeTxHash: string): Promise<SafeConfirmation[]> {
    return await db
      .select()
      .from(safeConfirmations)
      .where(eq(safeConfirmations.safeTxHash, safeTxHash))
      .orderBy(desc(safeConfirmations.createdAt));
  }
}

export const storage = new DatabaseStorage();
