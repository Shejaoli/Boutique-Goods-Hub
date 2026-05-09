import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    const counts = await db.select({ categoryId: productsTable.categoryId, cnt: count() })
      .from(productsTable)
      .groupBy(productsTable.categoryId);
    const countMap = new Map(counts.map(c => [c.categoryId, Number(c.cnt)]));
    res.json(cats.map(c => ({ ...c, productCount: countMap.get(c.id) ?? 0 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, icon } = req.body;
    const [cat] = await db.insert(categoriesTable).values({ name, icon: icon || null }).returning();
    res.status(201).json({ ...cat, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, icon } = req.body;
    const [cat] = await db.update(categoriesTable).set({ name, icon: icon ?? null }).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...cat, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
