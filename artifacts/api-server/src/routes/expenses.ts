import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
import { eq, like } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/expenses", authenticate, requireAdmin, async (req, res) => {
  try {
    const { month } = req.query as Record<string, string>;
    let rows;
    if (month) {
      rows = await db.select().from(expensesTable).where(like(expensesTable.date, `${month}%`)).orderBy(expensesTable.date);
    } else {
      rows = await db.select().from(expensesTable).orderBy(expensesTable.date);
    }
    res.json(rows.map(e => ({ ...e, amount: Number(e.amount), createdAt: e.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/expenses", authenticate, requireAdmin, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const [e] = await db.insert(expensesTable).values({ category, amount: String(amount), description: description ?? null, date }).returning();
    res.status(201).json({ ...e, amount: Number(e.amount), createdAt: e.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
