import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/modules/auth/services/session-service";
import { applyPayment, type MercadoPagoPayment } from "./promotion-payment";

export const PROMOTION_PRICE_CENTS = 1990;
export const PROMOTION_DAYS = 7;

function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (let index = 9; index < 11; index++) {
    const sum = [...value.slice(0, index)].reduce((total, digit, position) => total + Number(digit) * (index + 1 - position), 0);
    if (Number(value[index]) !== ((sum * 10) % 11) % 10) return false;
  }
  return true;
}

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new AppError("O pagamento Pix ainda não foi configurado.");
  return token;
}

async function paymentRequest(path: string, init?: RequestInit): Promise<MercadoPagoPayment> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new AppError("Não foi possível consultar o Mercado Pago. Tente novamente.");
  return response.json() as Promise<MercadoPagoPayment>;
}

export async function startPromotion(listingId: string, cpf: string) {
  const user = await requireUser();
  accessToken();
  const document = cpf.replace(/\D/g, "");
  if (!validCpf(document)) throw new AppError("Informe um CPF válido para gerar o Pix.");
  const listing = await db.listing.findFirst({
    where: { id: listingId, sellerId: user.id, status: "ACTIVE", seller: { status: "ACTIVE" }, category: { active: true } },
    select: { id: true, title: true, featuredUntil: true },
  });
  if (!listing) throw new AppError("Este anúncio precisa estar publicado para receber destaque.");
  if (listing.featuredUntil && listing.featuredUntil > new Date())
    throw new AppError("Este anúncio já está em destaque.");
  await db.listingPromotion.updateMany({
    where: { listingId, status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "CANCELLED" },
  });
  const pending = await db.listingPromotion.findFirst({
    where: { listingId, sellerId: user.id, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (pending?.providerPaymentId && pending.pixCode) return pending.id;
  if (pending) throw new AppError("O Pix deste anúncio está sendo gerado. Aguarde um instante.");

  const order = await db.listingPromotion.create({
    data: { listingId, sellerId: user.id, amountCents: PROMOTION_PRICE_CENTS, durationDays: PROMOTION_DAYS, expiresAt: new Date(Date.now() + 60 * 60_000) },
  });
  try {
    const payment = await paymentRequest("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": order.id },
      body: JSON.stringify({
        transaction_amount: PROMOTION_PRICE_CENTS / 100,
        description: `Destaque de anúncio por ${PROMOTION_DAYS} dias`,
        payment_method_id: "pix",
        date_of_expiration: new Date(Date.now() + 60 * 60_000).toISOString(),
        external_reference: order.id,
        payer: { email: user.email, identification: { type: "CPF", number: document } },
      }),
    });
    if (!payment.id || payment.external_reference !== order.id || payment.payment_method_id !== "pix" ||
      (payment.status !== "approved" && !payment.point_of_interaction?.transaction_data?.qr_code))
      throw new AppError("O Mercado Pago retornou um pagamento inválido.");
    await db.listingPromotion.update({
      where: { id: order.id },
      data: {
        providerPaymentId: String(payment.id),
        pixCode: payment.point_of_interaction?.transaction_data?.qr_code ?? null,
        pixQrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        expiresAt: payment.date_of_expiration ? new Date(payment.date_of_expiration) : new Date(Date.now() + 60 * 60_000),
      },
    });
    if (payment.status === "approved") await applyPayment(payment);
    return order.id;
  } catch (error) {
    await db.listingPromotion.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    throw error;
  }
}

export async function getMyPromotion(id: string) {
  const user = await requireUser();
  const order = await db.listingPromotion.findFirst({
    where: { id, sellerId: user.id },
    include: { listing: { select: { title: true, slug: true } } },
  });
  if (!order) throw new AppError("Destaque não encontrado.");
  if (order.status === "PENDING" && order.providerPaymentId) {
    try { await applyPayment(await paymentRequest(`/v1/payments/${order.providerPaymentId}`)); }
    catch (error) { console.error("Promotion payment refresh failed", error instanceof Error ? error.name : "UnknownError"); }
    return db.listingPromotion.findUniqueOrThrow({ where: { id }, include: { listing: { select: { title: true, slug: true } } } });
  }
  return order;
}

export async function processPaymentNotification(paymentId: string) {
  if (!/^\d+$/.test(paymentId)) return;
  const payment = await paymentRequest(`/v1/payments/${paymentId}`);
  await applyPayment(payment);
}
