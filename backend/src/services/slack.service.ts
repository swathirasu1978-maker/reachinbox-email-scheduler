import axios from "axios";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { redis } from "../config/redis";

export async function notifyRateLimit(userId: string, senderEmail: string, limit: number, hourKey: string) {
  const lockKey = `slack-rate-alert:${senderEmail}:${hourKey}`;
  const first = await redis.set(lockKey, "1", "EX", 3700, "NX");
  if (first !== "OK") return;

  const connection = await prisma.slackConnection.findUnique({ where: { userId } });
  if (!connection) return;

  if (!connection.channelId) return;

  const text = `⚠️ ReachInbox rate limit reached for ${senderEmail}. Hourly limit: ${limit}. Additional emails have been delayed until the next available hour.`;

  await axios.post("https://slack.com/api/chat.postMessage", {
    channel: connection.channelId,
    text
  }, {
    headers: { Authorization: `Bearer ${connection.accessToken}` }
  });
}
