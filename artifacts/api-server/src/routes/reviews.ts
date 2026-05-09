import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/products/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const reviews = await db.select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      customerId: reviewsTable.customerId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      customerName: usersTable.name,
    })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.customerId, usersTable.id))
      .where(eq(reviewsTable.productId, productId))
      .orderBy(reviewsTable.createdAt);

    res.json(reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products/:id/reviews", authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { rating, comment } = req.body;
    const [review] = await db.insert(reviewsTable).values({
      productId, customerId: req.userId!, rating, comment: comment ?? null,
    }).returning();
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.status(201).json({ ...review, customerName: user?.name ?? "Customer", createdAt: review.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
