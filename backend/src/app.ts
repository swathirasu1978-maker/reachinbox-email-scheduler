import express from "express";
import cors from "cors";
import session from "express-session";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import passport from "./passport";
import { env } from "./config/env";
import { emailQueue } from "./config/queue";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./controllers/auth.controller";
import { emailRouter } from "./controllers/email.controller";
import { slackRouter } from "./controllers/slack.controller";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 3600 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "reachinbox-backend" }));
app.use("/api/auth", authRouter);
app.use("/api/emails", requireAuth, emailRouter);
app.use("/api/slack", requireAuth, slackRouter);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter
});
app.use("/admin/queues", serverAdapter.getRouter());
