import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { emailQueue } from "../config/queue";
import { indexEmail, searchEmails } from "../services/search.service";

export const emailRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const scheduleSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  startTime: z.string(),
  delayMs: z.coerce.number().min(0).max(3600000),
  hourlyLimit: z.coerce.number().int().min(1).max(100000),
  senderEmail: z.string().email()
});

function parseEmails(text: string) {
  const values = text.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return [...new Set(values.filter(v => emailRegex.test(v)))];
}

emailRouter.post("/parse-leads", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV/text file required" });
  const emails = parseEmails(req.file.buffer.toString("utf8"));
  res.json({ count: emails.length, emails });
});

emailRouter.post("/schedule", upload.single("file"), async (req, res) => {
  const parsed = scheduleSchema.parse(req.body);
  const emails = req.file ? parseEmails(req.file.buffer.toString("utf8")) : parseEmails(req.body.emails || "");
  if (!emails.length) return res.status(400).json({ message: "No valid email addresses found" });

  const user = (req as any).user;
  let sender = await prisma.sender.findFirst({ where: { userId: user.id, email: parsed.senderEmail } });
  if (!sender) {
    sender = await prisma.sender.create({ data: { userId: user.id, email: parsed.senderEmail, displayName: user.name } });
  }

  const start = new Date(parsed.startTime);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid start time" });

  const created: any[] = [];
  for (let i = 0; i < emails.length; i++) {
    const scheduledAt = new Date(start.getTime() + i * parsed.delayMs);
    const jobId = `email-${user.id}-${Date.now()}-${i}-${Buffer.from(emails[i]).toString("base64url").slice(0, 12)}`;

    const email = await prisma.email.create({
      data: {
        userId: user.id,
        senderId: sender.id,
        recipient: emails[i],
        subject: parsed.subject,
        body: parsed.body,
        scheduledAt,
        jobId
      },
      include: { sender: true }
    });

    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await emailQueue.add("send-email", { emailId: email.id }, { jobId, delay });
    await indexEmail(email);
    created.push(email);
  }

  res.status(201).json({ count: created.length, scheduled: created });
});

emailRouter.get("/scheduled", async (req, res) => {
  const user = (req as any).user;
  const rows = await prisma.email.findMany({
    where: { userId: user.id, status: { in: ["SCHEDULED", "PROCESSING"] } },
    include: { sender: true },
    orderBy: { scheduledAt: "asc" },
    take: 1000
  });
  res.json(rows);
});

emailRouter.get("/sent", async (req, res) => {
  const user = (req as any).user;
  const rows = await prisma.email.findMany({
    where: { userId: user.id, status: { in: ["SENT", "FAILED"] } },
    include: { sender: true },
    orderBy: { sentAt: "desc" },
    take: 1000
  });
  res.json(rows);
});

emailRouter.get("/search", async (req, res) => {
  const user = (req as any).user;
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  res.json(await searchEmails(user.id, q));
});
