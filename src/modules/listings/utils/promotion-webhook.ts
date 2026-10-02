import { createHmac, timingSafeEqual } from "node:crypto";

export function validMercadoPagoSignature(signature: string | null, requestId: string | null, dataId: string | null, secret: string | undefined, now = Date.now()) {
  if (!secret || !signature || !requestId || !dataId || !/^\d+$/.test(dataId)) return false;
  const fields = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=")));
  if (!fields.ts || !fields.v1 || !/^[a-f0-9]{64}$/i.test(fields.v1)) return false;
  const timestamp = Number(fields.ts);
  const issuedAt = fields.ts.length >= 13 ? timestamp : timestamp * 1000;
  if (!Number.isFinite(timestamp) || Math.abs(now - issuedAt) > 10 * 60_000) return false;
  const expected = createHmac("sha256", secret)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${fields.ts};`)
    .digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(fields.v1, "hex"));
}
