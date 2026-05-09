import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { productsTable } from "./products";
import { suppliersTable } from "./suppliers";

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  type: text("type").notNull(), // import, export
  quantity: integer("quantity").notNull(),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  note: text("note"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type StockMovement = typeof stockMovementsTable.$inferSelect;
