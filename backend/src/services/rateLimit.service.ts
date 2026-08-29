import { redis } from "../config/redis";
import { env } from "../config/env";
import { notifyRateLimit } from "./slack.service";

function hourKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}${m}${d}${h}`;
}

export async function acquireHourlySlot(userId: string, senderId: string, senderEmail: string) {
  const now = new Date();
  const key = `email-rate:${senderId}:${hourKey(now)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3700);

  if (count <= env.MAX_EMAILS_PER_HOUR) {
    return { allowed: true, nextAvailableAt: now };
  }

  await redis.decr(key);
  const next = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0, 0
  ));
  await notifyRateLimit(userId, senderEmail, env.MAX_EMAILS_PER_HOUR, hourKey(now));
  return { allowed: false, nextAvailableAt: next };
}

export async function waitForMinimumGap(senderId: string) {
  const key = `email-send-gap:${senderId}`;
  const now = Date.now();
  const min = env.MIN_SEND_DELAY_MS;
  const existing = await redis.get(key);
  const previous = existing ? Number(existing) : 0;
  const target = Math.max(now, previous + min);
  const wait = target - now;
  if (wait > 0) await new Promise(r => setTimeout(r, wait));

  // Small Redis lock window: next worker sees this timestamp and waits.
  await redis.set(key, String(target), "PX", Math.max(min * 2, 5000));
}
