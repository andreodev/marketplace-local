import { createHmac, timingSafeEqual } from "node:crypto";

function signature(payload: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for chat.");
  return createHmac("sha256", secret).update(`chat:${payload}`).digest("base64url");
}

export function createChatTicket(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 60_000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyChatTicket(ticket: string): { userId: string; expiresAt: number } | null {
  const [payload, mac, extra] = ticket.split(".");
  if (!payload || !mac || extra) return null;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.userId !== "string" || typeof data.expiresAt !== "number" || data.expiresAt < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
