import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, usersTable, expensesTable, orderItemsTable, activityTable, notificationsTable } from "@workspace/db";
import { eq, gte, sum, count, desc, and, sql, lte } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

router.get("/reports/dashboard", authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRev] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable)
      .where(and(gte(ordersTable.createdAt, todayStart), eq(ordersTable.status, "delivered")));
    const [weekRev] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable)
      .where(and(gte(ordersTable.createdAt, weekStart), eq(ordersTable.status, "delivered")));
    const [totalProds] = await db.select({ cnt: count() }).from(productsTable);
    const [invVal] = await db.select({ val: sql<number>`sum(${productsTable.price}::numeric * ${productsTable.stockQuantity})` }).from(productsTable);
    const [pending] = await db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "pending"));
    const [totalCust] = await db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.role, "customer"));
    const [monthExp] = await db.select({ total: sum(expensesTable.amount) }).from(expensesTable)
      .where(gte(expensesTable.date, toDateStr(monthStart)));
    const [totalOrds] = await db.select({ cnt: count() }).from(ordersTable);

    const allProds = await db.select({ stock: productsTable.stockQuantity, min: productsTable.minStockLevel }).from(productsTable);
    const lowStock = allProds.filter(p => p.stock > 0 && p.stock <= p.min).length;
    const outOfStock = allProds.filter(p => p.stock <= 0).length;

    res.json({
      todayRevenue: Number(todayRev.total ?? 0),
      weekRevenue: Number(weekRev.total ?? 0),
      totalProducts: Number(totalProds.cnt),
      inventoryValue: Number(invVal.val ?? 0),
      pendingOrders: Number(pending.cnt),
      lowStockCount: lowStock,
      totalCustomers: Number(totalCust.cnt),
      monthExpenses: Number(monthExp.total ?? 0),
      totalOrders: Number(totalOrds.cnt),
      outOfStockCount: outOfStock,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/revenue", authenticate, requireAdmin, async (req, res) => {
  try {
    const days = parseInt((req.query.days as string) || "7");
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [rev] = await db.select({ total: sum(ordersTable.total), cnt: count() })
        .from(ordersTable).where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));
      result.push({ date: toDateStr(start), revenue: Number(rev.total ?? 0), orders: Number(rev.cnt ?? 0) });
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/top-products", authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(productsTable).orderBy(desc(productsTable.totalSold)).limit(5);
    res.json(rows.map(p => ({
      productId: p.id,
      productName: p.name,
      imageUrl: p.imageUrl,
      quantity: p.totalSold,
      revenue: Number(p.price) * p.totalSold,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/payment-methods", authenticate, requireAdmin, async (req, res) => {
  try {
    const methods = ["cash_on_delivery", "bank_transfer", "mobile_money"];
    const result = await Promise.all(methods.map(async method => {
      const [row] = await db.select({ cnt: count(), total: sum(ordersTable.total) })
        .from(ordersTable).where(eq(ordersTable.paymentMethod, method));
      return { method, count: Number(row?.cnt ?? 0), total: Number(row?.total ?? 0) };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/activity", authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(20);
    res.json(rows.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/low-stock", authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(productsTable).where(sql`${productsTable.stockQuantity} <= ${productsTable.minStockLevel}`);
    res.json(rows.map(p => ({
      id: p.id, name: p.name, description: p.description,
      price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      categoryId: p.categoryId, categoryName: null, unit: p.unit,
      stockQuantity: p.stockQuantity, minStockLevel: p.minStockLevel,
      imageUrl: p.imageUrl, supplierId: p.supplierId, supplierName: null,
      status: p.stockQuantity <= 0 ? "out_of_stock" : "low_stock",
      rating: 0, reviewCount: 0, isFeatured: p.isFeatured,
      discountPercent: p.discountPercent, createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
