import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function getCartForUser(userId: number) {
  const items = await db.select({
    id: cartItemsTable.id,
    productId: cartItemsTable.productId,
    quantity: cartItemsTable.quantity,
    name: productsTable.name,
    price: productsTable.price,
    unit: productsTable.unit,
    imageUrl: productsTable.imageUrl,
  })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const cartItems = items.map(i => ({
    id: i.id,
    productId: i.productId,
    productName: i.name,
    price: Number(i.price),
    unit: i.unit,
    quantity: i.quantity,
    imageUrl: i.imageUrl,
    subtotal: Number(i.price) * i.quantity,
  }));

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  return { items: cartItems, subtotal, discount: 0, total: subtotal, promoCode: null };
}

router.get("/cart", authenticate, async (req: AuthRequest, res) => {
  try {
    res.json(await getCartForUser(req.userId!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.userId!;
    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId))).limit(1);
    if (existing.length > 0) {
      await db.update(cartItemsTable).set({ quantity: existing[0].quantity + quantity })
        .where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db.insert(cartItemsTable).values({ userId, productId, quantity });
    }
    res.json(await getCartForUser(userId));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.userId!));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cart/:itemId", authenticate, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.userId!)));
    } else {
      await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.userId!)));
    }
    res.json(await getCartForUser(req.userId!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/:itemId", authenticate, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, req.userId!)));
    res.json(await getCartForUser(req.userId!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
