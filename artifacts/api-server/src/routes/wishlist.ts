import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistTable, productsTable, categoriesTable, suppliersTable, reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

function getStatus(stock: number, min: number) {
  if (stock <= 0) return "out_of_stock";
  if (stock <= min) return "low_stock";
  return "in_stock";
}

router.get("/wishlist", authenticate, async (req: AuthRequest, res) => {
  try {
    const items = await db.select().from(wishlistTable)
      .innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
      .where(eq(wishlistTable.userId, req.userId!));

    const result = await Promise.all(items.map(async ({ wishlist, products: p }) => {
      const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
      const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      return {
        id: wishlist.id,
        productId: wishlist.productId,
        product: {
          id: p.id, name: p.name, description: p.description,
          price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          categoryId: p.categoryId, categoryName: null,
          unit: p.unit, stockQuantity: p.stockQuantity, minStockLevel: p.minStockLevel,
          imageUrl: p.imageUrl, supplierId: p.supplierId, supplierName: null,
          status: getStatus(p.stockQuantity, p.minStockLevel),
          rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length,
          isFeatured: p.isFeatured, discountPercent: p.discountPercent,
          createdAt: p.createdAt.toISOString(),
        },
      };
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/wishlist", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId!;
    const existing = await db.select().from(wishlistTable)
      .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId))).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Already in wishlist" });
      return;
    }
    const [item] = await db.insert(wishlistTable).values({ userId, productId }).returning();
    res.status(201).json({ id: item.id, productId: item.productId, product: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/wishlist/:productId", authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.productId);
    await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, req.userId!), eq(wishlistTable.productId, productId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
