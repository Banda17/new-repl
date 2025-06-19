import {
  users,
  detentions,
  interchangeData,
  railwayLoadingOperations,
  type User,
  type UpsertUser,
  type InsertDetention,
  type SelectDetention,
  type InsertInterchange,
  type SelectInterchange,
  type InsertRailwayLoadingOperation,
  type SelectRailwayLoadingOperation,
} from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Detention operations
  createDetention(detention: InsertDetention): Promise<SelectDetention>;
  getDetentions(): Promise<SelectDetention[]>;
  updateDetention(id: number, detention: Partial<InsertDetention>): Promise<SelectDetention>;
  deleteDetention(id: number): Promise<void>;

  // Interchange data operations
  getInterchangeData(): Promise<SelectInterchange[]>;
  createOrUpdateInterchangeData(data: InsertInterchange): Promise<SelectInterchange>;

  // Railway loading operations
  createRailwayLoadingOperation(operation: InsertRailwayLoadingOperation): Promise<SelectRailwayLoadingOperation>;
  getRailwayLoadingOperations(): Promise<SelectRailwayLoadingOperation[]>;
  updateRailwayLoadingOperation(id: number, operation: Partial<InsertRailwayLoadingOperation>): Promise<SelectRailwayLoadingOperation>;
  deleteRailwayLoadingOperation(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Detention operations
  async createDetention(detention: InsertDetention): Promise<SelectDetention> {
    const [created] = await db.insert(detentions).values(detention).returning();
    return created;
  }

  async getDetentions(): Promise<SelectDetention[]> {
    return await db.select().from(detentions);
  }

  async updateDetention(id: number, detention: Partial<InsertDetention>): Promise<SelectDetention> {
    const [updated] = await db
      .update(detentions)
      .set(detention)
      .where(eq(detentions.id, id))
      .returning();
    return updated;
  }

  async deleteDetention(id: number): Promise<void> {
    await db.delete(detentions).where(eq(detentions.id, id));
  }

  // Interchange data operations
  async getInterchangeData(): Promise<SelectInterchange[]> {
    return await db.select().from(interchangeData);
  }

  async createOrUpdateInterchangeData(data: InsertInterchange): Promise<SelectInterchange> {
    const [result] = await db
      .insert(interchangeData)
      .values(data)
      .onConflictDoUpdate({
        target: interchangeData.station,
        set: {
          trainEntries: data.trainEntries,
          updatedAt: new Date(),
          updatedBy: data.updatedBy,
        },
      })
      .returning();
    return result;
  }

  // Railway loading operations
  async createRailwayLoadingOperation(operation: InsertRailwayLoadingOperation): Promise<SelectRailwayLoadingOperation> {
    const [created] = await db.insert(railwayLoadingOperations).values(operation).returning();
    return created;
  }

  async getRailwayLoadingOperations(): Promise<SelectRailwayLoadingOperation[]> {
    return await db.select().from(railwayLoadingOperations);
  }

  async updateRailwayLoadingOperation(id: number, operation: Partial<InsertRailwayLoadingOperation>): Promise<SelectRailwayLoadingOperation> {
    const [updated] = await db
      .update(railwayLoadingOperations)
      .set(operation)
      .where(eq(railwayLoadingOperations.id, id))
      .returning();
    return updated;
  }

  async deleteRailwayLoadingOperation(id: number): Promise<void> {
    await db.delete(railwayLoadingOperations).where(eq(railwayLoadingOperations.id, id));
  }
}

export const storage = new DatabaseStorage();