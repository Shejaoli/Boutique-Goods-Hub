import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable, promoCodesTable, notificationsTable, activityTable } from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [customer] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, order.customerId)).limit(1);
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    id: order.id,
    customerId: order.customerId,
    customerName: customer?.name ?? "Unknown",
    customerPhone: customer?.phone ?? null,
    items: items.map(i => ({
      id: i.id, productId: i.productId, productName: i.productName,
      quantity: i.quantity, price: Number(i.price), unit: i.unit,
      imageUrl: i.imageUrl, subtotal: Number(i.price) * i.quantity,
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.paymentMethod,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    promoCode: order.promoCode,
    assignedTo: order.assignedTo,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, customerId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const isAdmin = ["owner", "staff", "delivery"].includes(req.userRole ?? "");
    const conditions = [];
    if (!isAdmin) conditions.push(eq(ordersTable.customerId, req.userId!));
    if (status) conditions.push(eq(ordersTable.status, status));
    if (customerId && isAdmin) conditions.push(eq(ordersTable.customerId, parseInt(customerId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(ordersTable).where(whereClause);
    const rows = await db.select().from(ordersTable).where(whereClause).orderBy(desc(ordersTable.createdAt)).limit(limitNum).offset(offset);
    const orders = await Promise.all(rows.map(enrichOrder));

    res.json({ orders, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { paymentMethod, deliveryType, deliveryAddress, promoCode } = req.body;

    const cartItems = await db.select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      name: productsTable.name,
      price: productsTable.price,
      unit: productsTable.unit,
      imageUrl: productsTable.imageUrl,
      stock: productsTable.stockQuantity,
    })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.userId, userId));

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    let discount = 0;

    if (promoCode) {
      const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, promoCode)).limit(1);
      if (promo && promo.isActive) {
        discount = promo.type === "percent"
          ? subtotal * (Number(promo.value) / 100)
          : Number(promo.value);
        await db.update(promoCodesTable).set({ usageCount: promo.usageCount + 1 }).where(eq(promoCodesTable.id, promo.id));
      }
    }

    const total = Math.max(0, subtotal - discount);

    const [order] = await db.insert(ordersTable).values({
      customerId: userId,
      subtotal: String(subtotal),
      discount: String(discount),
      total: String(total),
      status: "pending",
      paymentMethod,
      deliveryType,
      deliveryAddress: deliveryAddress ?? null,
      promoCode: promoCode ?? null,
    }).returning();

    await Promise.all(cartItems.map(i =>
      db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: i.productId,
        productName: i.name,
        unit: i.unit,
        quantity: i.quantity,
        price: String(i.price),
        imageUrl: i.imageUrl,
      })
    ));

    // Decrease stock
    await Promise.all(cartItems.map(i =>
      db.update(productsTable)
        .set({ stockQuantity: Math.max(0, i.stock - i.quantity), totalSold: sql`${productsTable.totalSold} + ${i.quantity}` })
        .where(eq(productsTable.id, i.productId))
    ));

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    const [customer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    await db.insert(activityTable).values({
      type: "order_placed",
      message: `Order #${order.id} placed by ${customer?.name ?? "Customer"} — RWF ${total.toFixed(2)}`,
    });
    await db.insert(notificationsTable).values({
      type: "order_placed",
      message: `New order #${order.id} placed by ${customer?.name ?? "Customer"}`,
      isRead: false,
    });

    res.status(201).json(await enrichOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    const isAdmin = ["owner", "staff", "delivery"].includes(req.userRole ?? "");
    if (!isAdmin && order.customerId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(await enrichOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, assignedTo } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    await db.insert(activityTable).values({
      type: "order_status",
      message: `Order #${id} status changed to ${status}`,
    });

    await db.insert(notificationsTable).values({
      type: "order_status",
      message: `Your order #${id} is now ${status?.replace(/_/g, " ")}`,
      isRead: false,
      userId: order.customerId,
    });

    res.json(await enrichOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
