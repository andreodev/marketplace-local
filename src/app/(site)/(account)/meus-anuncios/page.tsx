import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listMyListings } from "@/modules/listings/queries/listings";
import { ListingStatusActions } from "@/modules/listings/components/listing-status-actions";
import { startPromotionAction } from "@/modules/listings/actions/promotion-actions";
import { Badge } from "@/components/ui/badge";
import {
  formatPrice,
  statusLabels,
} from "@/modules/listings/utils/presentation";
export const metadata = { title: "Meus anúncios" };
export default async function MyListings({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; sucesso?: string; destaque?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(params.pagina ?? "1", 10) || 1),
  );
  const listings = await listMyListings(page);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Meus anúncios</h1>
        <Button asChild>
          <Link href="/meus-anuncios/novo">+ Novo anúncio</Link>
        </Button>
      </div>
      {params.sucesso === "salvo" && (
        <p role="status" className="mb-6 text-primary">
          Anúncio salvo com sucesso.
        </p>
      )}
      {params.sucesso === "analise" && (
        <p role="status" className="mb-6 text-primary">
          Anúncio enviado para análise. Ele ficará oculto até a aprovação.
        </p>
      )}
      {params.destaque === "erro" && <p role="alert" className="mb-6 text-destructive">Não foi possível gerar o Pix. Confira a configuração do Mercado Pago e tente novamente.</p>}
      <div className="space-y-4">
        {listings.map((listing) => (
          <Card
            key={`${listing.id}-${listing.updatedAt.toISOString()}`}
            className="flex flex-col gap-5 sm:flex-row"
          >
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:aspect-square sm:w-36">
              {listing.images[0] ? (
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 144px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem foto
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">
                  {listing.status === "ACTIVE" ? (
                    <Link href={`/anuncio/${listing.slug}`}>
                      {listing.title}
                    </Link>
                  ) : (
                    listing.title
                  )}
                </h2>
                <span className="rounded-full bg-muted px-3 py-1 text-sm">
                  {statusLabels[listing.status]}
                </span>
                {listing.featuredUntil && listing.featuredUntil > new Date() && <Badge>Destaque até {listing.featuredUntil.toLocaleDateString("pt-BR")}</Badge>}
              </div>
              <p className="mt-2 text-lg font-semibold text-primary">
                {formatPrice(listing.price.toFixed(2))}
              </p>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                {listing.views} visualizações · {listing._count.contacts}{" "}
                contatos registrados anteriormente
              </p>
              {listing.moderationNote && (
                <p className="mb-4 rounded-lg bg-muted p-3 text-sm">
                  Motivo da revisão: {listing.moderationNote}
                </p>
              )}
              <ListingStatusActions
                listing={{
                  id: listing.id,
                  updatedAt: listing.updatedAt.toISOString(),
                  status: listing.status,
                }}
              />
              {listing.status === "ACTIVE" && <Button asChild variant="outline" size="sm" className="mt-3"><Link href={`/meus-anuncios/${listing.id}/divulgar`}>Divulgar anúncio</Link></Button>}
              {listing.status === "ACTIVE" && (!listing.featuredUntil || listing.featuredUntil <= new Date()) && (
                <form action={startPromotionAction} className="mt-3">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <label className="mb-2 block text-xs font-medium" htmlFor={`cpf-${listing.id}`}>CPF do pagador para o Pix</label>
                  <input id={`cpf-${listing.id}`} name="cpf" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} required placeholder="Somente 11 números" autoComplete="off" className="mb-2 block h-9 w-48 rounded-md border bg-background px-3 text-sm" />
                  <Button type="submit" variant="outline" size="sm">Destacar por R$ 19,90 / 7 dias</Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
      {!listings.length && (
        <Card className="py-16 text-center">
          <h2 className="text-xl font-semibold">Nenhum anúncio por aqui</h2>
          <p className="mt-3 text-muted-foreground">
            Crie um anúncio e dê uma nova história ao seu produto.
          </p>
        </Card>
      )}
      <nav
        aria-label="Páginas dos meus anúncios"
        className="mt-6 flex justify-between"
      >
        {page > 1 ? (
          <Link
            href={`/meus-anuncios?pagina=${page - 1}`}
            className="text-primary"
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        {listings.length === 20 && (
          <Link
            href={`/meus-anuncios?pagina=${page + 1}`}
            className="text-primary"
          >
            Próxima →
          </Link>
        )}
      </nav>
    </>
  );
}
