/**
 * Drizzle ORM Schema for NekoLog
 *
 * Database schema for Cloudflare D1 (SQLite).
 * Defines tables for users, cats, and toilet logs.
 */

import { sqliteTable, text, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Users table
 * Stores user information linked to Clerk authentication.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * Cats table
 * Stores cat information for each user.
 */
export const cats = sqliteTable(
  "cats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    birthDate: text("birth_date"),
    breed: text("breed"),
    weight: real("weight"),
    imageUrl: text("image_url"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idx_cats_user_id").on(table.userId)]
);

/**
 * Toilet logs table
 * Stores toilet activity records for each cat.
 */
export const toiletLogs = sqliteTable(
  "toilet_logs",
  {
    id: text("id").primaryKey(),
    catId: text("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["urine", "feces"] }).notNull(),
    timestamp: text("timestamp").notNull(),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_toilet_logs_cat_id").on(table.catId),
    index("idx_toilet_logs_timestamp").on(table.timestamp),
    index("idx_toilet_logs_cat_timestamp").on(table.catId, table.timestamp),
  ]
);

// Type exports for use in repositories
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Cat = typeof cats.$inferSelect;
export type NewCat = typeof cats.$inferInsert;

export type ToiletLog = typeof toiletLogs.$inferSelect;
export type NewToiletLog = typeof toiletLogs.$inferInsert;
