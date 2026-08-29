import { Queue } from "bullmq";
import { redis } from "./redis";

export const EMAIL_QUEUE = "email-scheduler";

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 24 * 3600, count: 5000 },
    removeOnFail: { age: 7 * 24 * 3600 }
  }
});
