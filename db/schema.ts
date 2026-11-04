import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sales = sqliteTable('sales', {
 id: text('id').primaryKey(), seller: text('seller').notNull(), quantity: integer('quantity').notNull(), date: text('date').notNull(), note: text('note').notNull().default(''), createdAt: text('created_at').notNull(), createdBy: text('created_by').notNull(),
});
