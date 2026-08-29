import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ message: "Authentication required" });
  (req as any).user = user;
  next();
}
