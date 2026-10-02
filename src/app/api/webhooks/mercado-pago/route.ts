import { NextResponse, type NextRequest } from "next/server";
import { processPaymentNotification } from "@/modules/listings/services/promotion-service";
import { validMercadoPagoSignature } from "@/modules/listings/utils/promotion-webhook";

export async function POST(request: NextRequest) {
  const dataId = request.nextUrl.searchParams.get("data.id");
  if (!validMercadoPagoSignature(request.headers.get("x-signature"), request.headers.get("x-request-id"), dataId, process.env.MERCADO_PAGO_WEBHOOK_SECRET))
    return new NextResponse(null, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.type === "payment" && String(body?.data?.id) === dataId) {
    await processPaymentNotification(dataId!);
  }
  return NextResponse.json({ ok: true });
}
