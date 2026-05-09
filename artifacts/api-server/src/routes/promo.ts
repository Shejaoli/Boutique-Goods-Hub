import { Router } from "express";
import { db } from "@workspace/db";
import { promoCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/promo", authenticate, requireAdmin, async (req, res) => {
  try {
    const codes = await db.select().from(promoCodesTable).orderBy(promoCodesTable.createdAt);
    res.json(codes.map(c => ({ ...c, value: Number(c.value), createdAt: undefined })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/promo", authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, type, value, maxUses, expiresAt } = req.body;
    const [p] = await db.insert(promoCodesTable).values({ code: code.toUpperCase(), type, value: String(value), maxUses: maxUses ?? null, expiresAt: expiresAt ?? null }).returning();
    res.status(201).json({ ...p, value: Number(p.value) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/promo/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(promoCodesTable).where(eq(promoCodesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/promo/validate", async (req, res) => {
  try {
    const { code, cartTotal = 0 } = req.body;
    const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase())).limit(1);
    if (!promo || !promo.isActive) {
      res.json({ valid: false, discount: 0, message: "Invalid or expired promo code" });
      return;
    }
    if (promo.maxUses && promo.usageCount >= promo.maxUses) {
      res.json({ valid: false, discount: 0, message: "Promo code has reached its usage limit" });
      return;
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      res.json({ valid: false, discount: 0, message: "Promo code has expired" });
      return;
    }
    const discount = promo.type === "percent"
      ? Number(cartTotal) * (Number(promo.value) / 100)
      : Number(promo.value);
    res.json({ valid: true, discount: Math.min(discount, Number(cartTotal)), message: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
