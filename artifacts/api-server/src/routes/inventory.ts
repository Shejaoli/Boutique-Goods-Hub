import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, stockMovementsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

router.post("/products/:id/stock", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity, type, supplierId, note, reason } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    const delta = type === "import" ? quantity : -quantity;
    const newQty = Math.max(0, product.stockQuantity + delta);

    await db.update(productsTable).set({ stockQuantity: newQty }).where(eq(productsTable.id, id));
    await db.insert(stockMovementsTable).values({
      productId: id, type, quantity, supplierId: supplierId ?? null,
      note: note ?? null, reason: reason ?? null,
    });

    const action = type === "import" ? "imported into" : "exported from";
    await db.insert(activityTable).values({
      type: type === "import" ? "stock_import" : "stock_export",
      message: `${quantity} units ${action} ${product.name}`,
    });

    const [updated] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    const min = updated.minStockLevel;
    const stock = updated.stockQuantity;
    const status = stock <= 0 ? "out_of_stock" : stock <= min ? "low_stock" : "in_stock";
    res.json({ ...updated, price: Number(updated.price), originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null, status, rating: 0, reviewCount: 0, categoryName: null, supplierName: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
