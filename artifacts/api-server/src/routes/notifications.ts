import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, or, isNull } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/notifications", authenticate, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(notificationsTable)
      .where(or(isNull(notificationsTable.userId), eq(notificationsTable.userId, req.userId!)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/read-all", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.update(notificationsTable).set({ isRead: true })
      .where(or(isNull(notificationsTable.userId), eq(notificationsTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
