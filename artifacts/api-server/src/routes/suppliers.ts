import { Router } from "express";
import { db } from "@workspace/db";
import { suppliersTable, stockMovementsTable } from "@workspace/db";
import { eq, sum } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/suppliers", authenticate, requireAdmin, async (req, res) => {
  try {
    const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
    const result = await Promise.all(suppliers.map(async s => {
      const [spent] = await db.select({ total: sum(stockMovementsTable.quantity) })
        .from(stockMovementsTable).where(eq(stockMovementsTable.supplierId, s.id));
      return { ...s, totalSpent: Number(spent?.total ?? 0) };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/suppliers", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, contactPerson, phone, address } = req.body;
    const [s] = await db.insert(suppliersTable).values({ name, contactPerson: contactPerson ?? null, phone: phone ?? null, address: address ?? null }).returning();
    res.status(201).json({ ...s, totalSpent: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/suppliers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, contactPerson, phone, address } = req.body;
    const [s] = await db.update(suppliersTable).set({ name, contactPerson: contactPerson ?? null, phone: phone ?? null, address: address ?? null }).where(eq(suppliersTable.id, id)).returning();
    if (!s) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...s, totalSpent: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/suppliers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
