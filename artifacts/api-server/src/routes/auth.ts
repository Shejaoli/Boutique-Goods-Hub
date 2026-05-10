import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, signToken, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, phone: phone ?? null, passwordHash, role: "customer" }).returning();
    const token = signToken(user.id, user.role);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!["owner", "staff", "delivery"].includes(user.role)) {
      res.status(403).json({ error: "Not an admin account" });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    loyaltyPoints: user.loyaltyPoints,
    totalOrders: 0,
    totalSpent: 0,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
