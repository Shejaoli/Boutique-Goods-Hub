import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, suppliersTable, reviewsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql, count, avg } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

function getStatus(stock: number, min: number) {
  if (stock <= 0) return "out_of_stock";
  if (stock <= min) return "low_stock";
  return "in_stock";
}

async function enrichProduct(p: typeof productsTable.$inferSelect) {
  const [catRow] = p.categoryId
    ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1)
    : [null];
  const [suppRow] = p.supplierId
    ? await db.select().from(suppliersTable).where(eq(suppliersTable.id, p.supplierId)).limit(1)
    : [null];
  const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const stock = p.stockQuantity;
  const min = p.minStockLevel;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    categoryId: p.categoryId,
    categoryName: catRow?.name ?? null,
    unit: p.unit,
    stockQuantity: stock,
    minStockLevel: min,
    imageUrl: p.imageUrl,
    supplierId: p.supplierId,
    supplierName: suppRow?.name ?? null,
    status: getStatus(stock, min),
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    isFeatured: p.isFeatured,
    discountPercent: p.discountPercent,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, inStock, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (category) conditions.push(eq(productsTable.categoryId, parseInt(category)));
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
    if (inStock === "true") conditions.push(gte(productsTable.stockQuantity, 1));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    if (sort === "price_asc") orderBy = asc(productsTable.price);
    else if (sort === "price_desc") orderBy = desc(productsTable.price);
    else if (sort === "popular") orderBy = desc(productsTable.totalSold);
    else orderBy = desc(productsTable.createdAt);

    const [{ total }] = await db.select({ total: count() }).from(productsTable).where(whereClause);
    const rows = await db.select().from(productsTable).where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset);
    const products = await Promise.all(rows.map(enrichProduct));

    res.json({ products, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/featured", async (req, res) => {
  try {
    const newInRows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(8);
    const popularRows = await db.select().from(productsTable).orderBy(desc(productsTable.totalSold)).limit(8);
    const flashRows = await db.select().from(productsTable).where(sql`${productsTable.discountPercent} is not null`).limit(6);
    const topRows = await db.select().from(productsTable).orderBy(desc(productsTable.totalSold)).limit(6);

    const [newIn, popular, flashDeals, topSelling] = await Promise.all([
      Promise.all(newInRows.map(enrichProduct)),
      Promise.all(popularRows.map(enrichProduct)),
      Promise.all(flashRows.map(enrichProduct)),
      Promise.all(topRows.map(enrichProduct)),
    ]);

    res.json({ newIn, popular, flashDeals, topSelling });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [p] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!p) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichProduct(p));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, originalPrice, categoryId, unit, stockQuantity, minStockLevel, imageUrl, supplierId, isFeatured, discountPercent } = req.body;
    const [p] = await db.insert(productsTable).values({
      name, description: description ?? null, price: String(price),
      originalPrice: originalPrice ? String(originalPrice) : null,
      categoryId: categoryId ?? null, unit: unit || "1kg",
      stockQuantity: stockQuantity ?? 0, minStockLevel: minStockLevel ?? 10,
      imageUrl: imageUrl ?? null, supplierId: supplierId ?? null,
      isFeatured: isFeatured ?? false, discountPercent: discountPercent ?? null,
    }).returning();
    res.status(201).json(await enrichProduct(p));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    const fields = ["name","description","price","originalPrice","categoryId","unit","stockQuantity","minStockLevel","imageUrl","supplierId","isFeatured","discountPercent"];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === "price" || f === "originalPrice") updates[f] = req.body[f] !== null ? String(req.body[f]) : null;
        else updates[f] = req.body[f];
      }
    }
    const [p] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!p) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichProduct(p));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
