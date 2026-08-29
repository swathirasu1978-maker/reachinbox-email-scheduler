import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "./config/redis";
import { prisma } from "./config/prisma";
import { EMAIL_QUEUE } from "./config/queue";
import { env } from "./config/env";
import { acquireHourlySlot, waitForMinimumGap } from "./services/rateLimit.service";
import { sendEmail } from "./services/mail.service";
import { indexEmail } from "./services/search.service";

const worker = new Worker(EMAIL_QUEUE, async job => {
  const emailId = job.data.emailId as string;

  const email = await prisma.email.findUnique({ where: { id: emailId }, include: { sender: true } });
  if (!email) return;
  if (email.status === "SENT") return;

  const slot = await acquireHourlySlot(email.userId, email.senderId, email.sender.email);
  if (!slot.allowed) {
    await prisma.email.update({
      where: { id: email.id },
      data: { scheduledAt: slot.nextAvailableAt, status: "SCHEDULED" }
    });
    await indexEmail({ ...email, scheduledAt: slot.nextAvailableAt, status: "SCHEDULED" });
    // Reuse same deterministic job id after removing current active job.
    await job.remove();
    const { emailQueue } = await import("./config/queue");
    await emailQueue.add("send-email", { emailId }, {
      jobId: email.jobId,
      delay: Math.max(0, slot.nextAvailableAt.getTime() - Date.now())
    });
    return;
  }

  await waitForMinimumGap(email.senderId);

  const locked = await prisma.email.updateMany({
    where: { id: email.id, status: { not: "SENT" } },
    data: { status: "PROCESSING", attempts: { increment: 1 } }
  });
  if (locked.count !== 1) return;

  try {
    const result = await sendEmail(email.recipient, email.subject, email.body);
    const updated = await prisma.email.update({
      where: { id: email.id },
      data: {
  status: "SENT",
  sentAt: new Date(),
  previewUrl: result.previewUrl
}
    });
    await indexEmail(updated);
    console.log(`Sent ${email.recipient} | preview: ${result.previewUrl || "unavailable"}`);
  } catch (error: any) {
    const updated = await prisma.email.update({
      where: { id: email.id },
      data: { status: "FAILED", errorMessage: error?.message || "SMTP error" }
    });
    await indexEmail(updated);
    throw error;
  }
}, {
  connection: redis,
  concurrency: env.WORKER_CONCURRENCY,
  limiter: undefined
});

worker.on("completed", job => console.log(`Job completed: ${job.id}`));
worker.on("failed", (job, err) => console.error(`Job failed: ${job?.id}`, err.message));
console.log(`Email worker running with concurrency=${env.WORKER_CONCURRENCY}`);
