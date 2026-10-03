import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyPromotion, PROMOTION_DAYS, PROMOTION_PRICE_CENTS } from "@/modules/listings/services/promotion-service";
import { formatPrice } from "@/modules/listings/utils/presentation";

import Image from "next/image";
import { AppError } from "@/lib/errors";

const staticQrImageUrl = process.env.MERCADO_PAGO_QR_STATIC_IMAGE_URL;

export const metadata = { title: "Destaque do anúncio" };

export default async function PromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getMyPromotion(id).catch((error: unknown) => {
    if (error instanceof AppError) return null;
    throw error;
  });
  if (!order) notFound();
  const expired = order.expiresAt && order.expiresAt < new Date();
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/meus-anuncios" className="text-sm text-primary hover:underline">← Meus anúncios</Link>
      <Card className="mt-5">
        <CardHeader><CardTitle>Destaque para {order.listing.title}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{formatPrice((PROMOTION_PRICE_CENTS / 100).toFixed(2))} por {PROMOTION_DAYS} dias. O prazo começa quando o Pix for aprovado.</p>
          {order.status === "PAID" && order.appliedUntil && order.appliedUntil > new Date() ? (
            <div role="status" className="rounded-lg border border-primary/30 bg-secondary p-4">
              <p className="font-semibold">Destaque ativo</p>
              <p className="mt-1 text-sm">Válido até {order.appliedUntil?.toLocaleString("pt-BR", { timeZone: "America/Manaus" })}.</p>
              <Button asChild className="mt-4"><Link href={`/anuncio/${order.listing.slug}`}>Ver anúncio</Link></Button>
            </div>
          ) : order.status === "PAID" ? (
            <p role="status">O período deste destaque terminou em {order.appliedUntil?.toLocaleDateString("pt-BR")}.</p>
          ) : order.status === "REVERSED" ? (
            <p role="status">O pagamento foi estornado e o destaque foi encerrado.</p>
          ) : order.status === "CANCELLED" || expired ? (
            <p role="status">Este Pix expirou. Volte aos seus anúncios para gerar outro.</p>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">Pague com Pix para ativar o destaque.</p>
              {order.pixQrCodeBase64 ? <Image src={`data:image/png;base64,${order.pixQrCodeBase64}`} alt="QR Code do Pix" width={240} height={240} unoptimized className="mx-auto" /> : staticQrImageUrl && <Image src={staticQrImageUrl} alt="QR Code do Pix" width={240} height={240} unoptimized className="mx-auto" />}
              {order.pixCode && <div><label htmlFor="pix-code" className="text-sm font-medium">Pix Copia e Cola</label><textarea id="pix-code" readOnly value={order.pixCode} className="mt-1 h-24 w-full rounded-lg border bg-background p-3 text-xs" /></div>}
              <p className="text-sm text-muted-foreground">Depois do pagamento, atualize esta página. A confirmação também chega automaticamente pelo Mercado Pago.</p>
              <Button asChild variant="outline"><Link href={`/meus-anuncios/destaque/${order.id}`}>Atualizar status</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
