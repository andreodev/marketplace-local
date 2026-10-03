import "server-only";
import { db } from "@/lib/db";

export type MercadoPagoPayment = {
  id: string | number;
  status: string;
  external_reference: string;
  transaction_amount: number;
  payment_method_id: string;
  date_of_expiration?: string;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};

export async function applyPayment(payment: MercadoPagoPayment) {
  const order = await db.listingPromotion.findUnique({ where: { id: payment.external_reference } });
  if (!order || String(payment.id) !== order.providerPaymentId || payment.payment_method_id !== "pix" || payment.transaction_amount !== order.amountCents / 100) return;
  if (payment.status === "refunded" || payment.status === "charged_back") {
    await db.$transaction(async (tx) => {
      const result = await tx.listingPromotion.updateMany({ where: { id: order.id, status: "PAID" }, data: { status: "REVERSED" } });
      if (!result.count || !order.appliedUntil) return;
      await tx.listing.updateMany({ where: { id: order.listingId, featuredUntil: order.appliedUntil }, data: { featuredUntil: null } });
    });
    return;
  }
  if (payment.status !== "approved") return;
  await db.$transaction(async (tx) => {
    const result = await tx.listingPromotion.updateMany({
      where: { id: order.id, status: { in: ["PENDING", "CANCELLED"] } },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (!result.count) return;
    const listing = await tx.listing.findUniqueOrThrow({ where: { id: order.listingId }, select: { featuredUntil: true } });
    const start = Math.max(Date.now(), listing.featuredUntil?.getTime() ?? 0);
    const appliedUntil = new Date(start + order.durationDays * 86_400_000);
    await tx.listing.update({ where: { id: order.listingId }, data: { featuredUntil: appliedUntil } });
    await tx.listingPromotion.update({ where: { id: order.id }, data: { appliedUntil } });
  });
}
