import { pgTable, text, serial, timestamp, boolean, jsonb, integer, numeric, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const detentions = pgTable("detentions", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull(),
  rakeId: text("rake_id").notNull(),
  rakeName: text("rake_name").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  placementTime: timestamp("placement_time").notNull(),
  releaseTime: timestamp("release_time").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arPlReason: text("ar_pl_reason"),
  plRlReason: text("pl_rl_reason"),
  rlDpReason: text("rl_dp_reason"),
  wagonType: text("wagon_type").notNull().default("BOXNHL"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id").references(() => users.id),
});

export const interchangeData = pgTable("interchange_data", {
  id: serial("id").primaryKey(),
  station: text("station").notNull().unique(),
  trainEntries: jsonb("train_entries").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const railwayLoadingOperations = pgTable("railway_loading_operations", {
  id: serial("id").primaryKey(),
  pDate: timestamp("p_date"),
  station: text("station"),
  siding: text("siding"),
  imported: text("imported"),
  commodity: text("commodity"),
  commType: text("comm_type"),
  commCg: text("comm_cg"),
  demand: text("demand"),
  state: text("state"),
  rly: text("rly"),
  wagons: integer("wagons"),
  type: text("type"),
  units: numeric("units"),
  loadingType: text("loading_type"),
  rrNoFrom: integer("rr_no_from"),
  rrNoTo: integer("rr_no_to"),
  rrDate: timestamp("rr_date"),
  tonnage: numeric("tonnage"),
  freight: numeric("freight"),
  tIndents: integer("t_indents"),
  osIndents: integer("os_indents"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertDetentionSchema = createInsertSchema(detentions);
export const selectDetentionSchema = createSelectSchema(detentions);

export const insertInterchangeSchema = createInsertSchema(interchangeData);
export const selectInterchangeSchema = createSelectSchema(interchangeData);

export const insertRailwayLoadingOperationSchema = createInsertSchema(railwayLoadingOperations);
export const selectRailwayLoadingOperationSchema = createSelectSchema(railwayLoadingOperations);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDetention = typeof detentions.$inferInsert;
export type SelectDetention = typeof detentions.$inferSelect;
export type InsertInterchange = typeof interchangeData.$inferInsert;
export type SelectInterchange = typeof interchangeData.$inferSelect;
export type InsertRailwayLoadingOperation = typeof railwayLoadingOperations.$inferInsert;
export type SelectRailwayLoadingOperation = typeof railwayLoadingOperations.$inferSelect;