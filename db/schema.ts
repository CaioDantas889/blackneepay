import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sales = sqliteTable('sales', {
 id: text('id').primaryKey(), seller: text('seller').notNull(), quantity: integer('quantity').notNull(), date: text('date').notNull(), note: text('note').notNull().default(''), createdAt: text('created_at').notNull(), createdBy: text('created_by').notNull(),
});
export const adminUsers = sqliteTable('admin_users', {
 id: text('id').primaryKey(), email: text('email').notNull().unique(), passwordHash: text('password_hash').notNull(), createdAt: text('created_at').notNull(),
});
export const adminSessions = sqliteTable('admin_sessions', {
 tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }), expiresAt: integer('expires_at').notNull(),
});
export const adminLoginAttempts = sqliteTable('admin_login_attempts', {
 key: text('key').primaryKey(), failures: integer('failures').notNull(), resetAt: integer('reset_at').notNull(),
});
