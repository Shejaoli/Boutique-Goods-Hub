import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "greenbasket-secret-key";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userRole || !["owner", "staff", "delivery"].includes(req.userRole)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "owner") {
    res.status(403).json({ error: "Forbidden — owner only" });
    return;
  }
  next();
}

export function signToken(id: number, role: string): string {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
}
