import { Router } from "express";
import axios from "axios";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

export const slackRouter = Router();

slackRouter.get("/connect", (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: (req as any).user.id })).toString("base64url");
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", env.SLACK_CLIENT_ID);
  url.searchParams.set("scope", "chat:write,channels:read,groups:read");
  url.searchParams.set("redirect_uri", env.SLACK_CALLBACK_URL);
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

slackRouter.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return res.status(400).send("Missing OAuth parameters");
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const tokenResponse = await axios.post("https://slack.com/api/oauth.v2.access", null, {
      params: {
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: env.SLACK_CALLBACK_URL
      }
    });
    if (!tokenResponse.data.ok) return res.status(400).send(tokenResponse.data.error || "Slack OAuth failed");

    const data = tokenResponse.data;
    const teamId = data.team?.id;
    const teamName = data.team?.name;
    const channelId = data.incoming_webhook?.channel_id || null;

    await prisma.slackConnection.upsert({
      where: { userId: decoded.userId },
      update: { accessToken: data.access_token, teamId, teamName, channelId },
      create: { userId: decoded.userId, accessToken: data.access_token, teamId, teamName, channelId }
    });

    res.redirect(env.SLACK_REDIRECT_AFTER_CONNECT);
  } catch (e: any) {
    res.status(500).send(e?.message || "Slack connection failed");
  }
});

slackRouter.delete("/disconnect", async (req, res) => {
  const user = (req as any).user;
  await prisma.slackConnection.deleteMany({ where: { userId: user.id } });
  res.json({ ok: true });
});

slackRouter.get("/status", async (req, res) => {
  const user = (req as any).user;
  const connection = await prisma.slackConnection.findUnique({ where: { userId: user.id } });
  res.json({ connected: !!connection, teamName: connection?.teamName || null, channelId: connection?.channelId || null });
});
