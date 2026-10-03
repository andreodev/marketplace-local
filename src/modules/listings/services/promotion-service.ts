import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/modules/auth/services/session-service";
import { applyPayment, type MercadoPagoPayment } from "./promotion-payment";

export const PROMOTION_PRICE_CENTS = 1990;
export const PROMOTION_DAYS = 7;

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new AppError("O pagamento Pix ainda não foi configurado.");
  return token;
}
type MercadoPagoOrder = { id?: string; external_reference?: string; type_response?: { qr_data?: string }; transactions?: { payments?: Array<{ id?: string; status?: string; amount?: string; payment_method?: { id?: string; qr_code?: string; qr_code_base64?: string } }> } };
async function orderRequest(path: string, init?: RequestInit): Promise<MercadoPagoOrder> {
  const response = await fetch(`https://api.mercadopago.com${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new AppError("Não foi possível consultar o Mercado Pago. Tente novamente.");
  return response.json() as Promise<MercadoPagoOrder>;
}
function orderPayment(order: MercadoPagoOrder): MercadoPagoPayment | undefined {
  const payment = order.transactions?.payments?.[0];
  if (!payment?.id || !order.external_reference) return;
  return { id: payment.id, status: payment.status === "processed" ? "approved" : payment.status ?? "pending", external_reference: order.external_reference, transaction_amount: Number(payment.amount), payment_method_id: payment.payment_method?.id ?? "pix", point_of_interaction: { transaction_data: { ...payment.payment_method, qr_code: order.type_response?.qr_data ?? payment.payment_method?.qr_code } } };
}
export async function startPromotion(listingId: string) {
  const user = await requireUser(); accessToken();
  const externalPosId = process.env.MERCADO_PAGO_QR_EXTERNAL_POS_ID; const staticQrCode = process.env.MERCADO_PAGO_QR_STATIC_CODE;
  if (!externalPosId || !staticQrCode) throw new AppError("Configure o caixa do Mercado Pago para gerar o Pix.");
  const listing = await db.listing.findFirst({ where: { id: listingId, sellerId: user.id, status: "ACTIVE", seller: { status: "ACTIVE" }, category: { active: true } }, select: { id: true, title: true, featuredUntil: true } });
  if (!listing) throw new AppError("Este anúncio precisa estar publicado para receber destaque.");
  if (listing.featuredUntil && listing.featuredUntil > new Date()) throw new AppError("Este anúncio já está em destaque.");
  await db.listingPromotion.updateMany({ where: { listingId, status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "CANCELLED" } });
  const pending = await db.listingPromotion.findFirst({ where: { listingId, sellerId: user.id, status: "PENDING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (pending?.providerPaymentId && pending.pixCode) return pending.id;
  if (pending) throw new AppError("O Pix deste anúncio está sendo gerado. Aguarde um instante.");
  const order = await db.listingPromotion.create({ data: { listingId, sellerId: user.id, amountCents: PROMOTION_PRICE_CENTS, durationDays: PROMOTION_DAYS, expiresAt: new Date(Date.now() + 60 * 60_000) } });
  try {
    const payment = await orderRequest("/v1/orders", { method: "POST", headers: { "X-Idempotency-Key": order.id }, body: JSON.stringify({ type: "qr", total_amount: (PROMOTION_PRICE_CENTS / 100).toFixed(2), description: `Destaque: ${listing.title}`.slice(0, 150), external_reference: order.id, expiration_time: "PT1H", config: { qr: { external_pos_id: externalPosId, mode: "static" } }, transactions: { payments: [{ amount: (PROMOTION_PRICE_CENTS / 100).toFixed(2) }] } }) });
    const pix = orderPayment(payment);
    if (!payment.id || !pix || pix.external_reference !== order.id) throw new AppError("O Mercado Pago retornou um pagamento inválido.");
    await db.listingPromotion.update({ where: { id: order.id }, data: { providerPaymentId: payment.id, pixCode: pix.point_of_interaction?.transaction_data?.qr_code ?? staticQrCode, pixQrCodeBase64: pix.point_of_interaction?.transaction_data?.qr_code_base64 ?? null, expiresAt: new Date(Date.now() + 60 * 60_000) } });
    if (pix.status === "approved") await applyPayment(pix);
    return order.id;
  } catch (error) { await db.listingPromotion.update({ where: { id: order.id }, data: { status: "CANCELLED" } }); throw error; }
}
export async function getMyPromotion(id: string) {
  const user = await requireUser(); const order = await db.listingPromotion.findFirst({ where: { id, sellerId: user.id }, include: { listing: { select: { title: true, slug: true } } } });
  if (!order) throw new AppError("Destaque não encontrado.");
  if (order.status === "PENDING" && order.providerPaymentId) { try { const payment = orderPayment(await orderRequest(`/v1/orders/${order.providerPaymentId}`)); if (payment) await applyPayment(payment); } catch (error) { console.error("Promotion payment refresh failed", error instanceof Error ? error.name : "UnknownError"); } return db.listingPromotion.findUniqueOrThrow({ where: { id }, include: { listing: { select: { title: true, slug: true } } } }); }
  return order;
}
export async function processPaymentNotification(orderId: string) { const payment = orderPayment(await orderRequest(`/v1/orders/${orderId}`)); if (payment) await applyPayment(payment); }
