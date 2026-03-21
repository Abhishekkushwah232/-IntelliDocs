import { pgEnum, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messageRole = pgEnum("message_role", ["user", "assistant"]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: messageRole("role").notNull(),
  content: text("content").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

