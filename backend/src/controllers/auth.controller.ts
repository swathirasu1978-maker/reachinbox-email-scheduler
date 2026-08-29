import { Router } from "express";
import passport from "passport";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

export const authRouter = Router();

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    const user = req.user as any;
    (req.session as any).userId = user.id;
    res.redirect(env.FRONTEND_URL);
  }
);

authRouter.get("/me", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ message: "Not logged in" });
  res.json(user);
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
