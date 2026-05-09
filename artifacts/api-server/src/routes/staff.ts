import { Router } from "express";
import { db } from "@workspace/db";
import { staffTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authenticate, requireAdmin, requireOwner, signToken } from "../middlewares/auth";

const router = Router();

function fmt(s: typeof staffTable.$inferSelect) {
  return { id: s.id, name: s.name, email: s.email, role: s.role, pin: s.pin, isActive: s.isActive };
}

router.get("/staff", authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(staffTable).orderBy(staffTable.name);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/staff", authenticate, requireOwner, async (req, res) => {
  try {
    const { name, email, role, pin, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role, pin: pin ?? null }).returning();
    const [s] = await db.insert(staffTable).values({ name, email, role, pin: pin ?? null }).returning();
    res.status(201).json(fmt(s));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/staff/:id", authenticate, requireOwner, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, role, pin, isActive } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (pin !== undefined) updates.pin = pin;
    if (isActive !== undefined) updates.isActive = isActive;
    const [s] = await db.update(staffTable).set(updates).where(eq(staffTable.id, id)).returning();
    if (!s) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(s));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/staff/:id", authenticate, requireOwner, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(staffTable).where(eq(staffTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
