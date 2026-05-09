import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, ordersTable } from "@workspace/db";
import { eq, ilike, count, sum, desc } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/customers", authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, page = "1" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let query = db.select().from(usersTable).where(eq(usersTable.role, "customer"));
    if (search) {
      query = db.select().from(usersTable).where(ilike(usersTable.name, `%${search}%`)) as typeof query;
    }
    const rows = await query.orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "customer"));

    const customers = await Promise.all(rows.map(async u => {
      const [stats] = await db.select({ cnt: count(), spent: sum(ordersTable.total) })
        .from(ordersTable).where(eq(ordersTable.customerId, u.id));
      return {
        id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
        avatarUrl: u.avatarUrl, loyaltyPoints: u.loyaltyPoints,
        totalOrders: Number(stats?.cnt ?? 0),
        totalSpent: Number(stats?.spent ?? 0),
        isBlocked: u.isBlocked,
        createdAt: u.createdAt.toISOString(),
      };
    }));

    res.json({ customers, total: Number(total), page: pageNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) { res.status(404).json({ error: "Not found" }); return; }
    const [stats] = await db.select({ cnt: count(), spent: sum(ordersTable.total) })
      .from(ordersTable).where(eq(ordersTable.customerId, id));
    res.json({
      id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
      avatarUrl: u.avatarUrl, loyaltyPoints: u.loyaltyPoints,
      totalOrders: Number(stats?.cnt ?? 0),
      totalSpent: Number(stats?.spent ?? 0),
      isBlocked: u.isBlocked,
      createdAt: u.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/customers/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, avatarUrl } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    const [u] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!u) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, avatarUrl: u.avatarUrl, loyaltyPoints: u.loyaltyPoints, totalOrders: 0, totalSpent: 0, isBlocked: u.isBlocked, createdAt: u.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/customers/:id/block", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isBlocked } = req.body;
    const [u] = await db.update(usersTable).set({ isBlocked }).where(eq(usersTable.id, id)).returning();
    if (!u) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, avatarUrl: u.avatarUrl, loyaltyPoints: u.loyaltyPoints, totalOrders: 0, totalSpent: 0, isBlocked: u.isBlocked, createdAt: u.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
