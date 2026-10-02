import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { removeListingAsAdminAction } from "@/modules/listings/actions/admin-listing-actions";
import { findListingForAdmin } from "@/modules/listings/queries/admin-listings";
import { formatPrice } from "@/modules/listings/utils/presentation";
import { AccountReviewActions } from "@/modules/listings/components/account-review-actions";
import { ACCOUNT_CATEGORY_SLUG, accountTypeLabels } from "@/modules/listings/utils/account-policy";

export default async function AdminListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.cuid().safeParse(id).success) notFound();
  const listing = await findListingForAdmin(id);
  if (!listing) notFound();
  return (
    <>
      <Link href="/admin/anuncios" className="text-sm text-primary">
        ← Anúncios
      </Link>
      <h1 className="mb-4 mt-4 text-3xl font-semibold">{listing.title}</h1>
      <p className="mb-6 text-2xl font-semibold text-primary">
        {formatPrice(listing.price.toFixed(2))}
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          {listing.images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="400px"
              />
            </div>
          ))}
        </div>
        <Card className="space-y-3">
          <p>
            <span className="text-muted-foreground">Status:</span>{" "}
            {listing.status}
          </p>
          <p>
            <span className="text-muted-foreground">Vendedor:</span>{" "}
            {listing.seller.name} ({listing.seller.email})
          </p>
          <p>
            <span className="text-muted-foreground">Categoria:</span>{" "}
            {listing.category.name}
          </p>
          {listing.category.slug === ACCOUNT_CATEGORY_SLUG && (
            <>
              <p><span className="text-muted-foreground">Plataforma:</span> {listing.accountPlatform || "Não informada"}</p>
              <p><span className="text-muted-foreground">Tipo:</span> {listing.accountType && listing.accountType in accountTypeLabels ? accountTypeLabels[listing.accountType as keyof typeof accountTypeLabels] : "Não informado"}</p>
              <p className="break-all"><span className="text-muted-foreground">Regras de transferência:</span> {listing.accountPolicyUrl || "Não informadas"}</p>
              <p><span className="text-muted-foreground">Declaração do vendedor:</span> {listing.accountTransferConfirmed ? "Confirmada" : "Pendente"}</p>
            </>
          )}
          <p>
            <span className="text-muted-foreground">Local:</span>{" "}
            {listing.neighborhood}, {listing.city} · {listing.state}
          </p>
          <p>
            <span className="text-muted-foreground">Métricas:</span>{" "}
            {listing.views} visualizações · {listing._count.contacts} contatos ·{" "}
            {listing._count.favorites} favoritos · {listing._count.reports}{" "}
            denúncias
          </p>
          {listing.status !== "REMOVED" && (
            <AdminActionButton
              action={removeListingAsAdminAction}
              values={{ id: listing.id }}
              label="Remover anúncio"
              variant="ghost"
            />
          )}
        </Card>
      </div>
      {listing.status === "PENDING_REVIEW" && listing.category.slug === ACCOUNT_CATEGORY_SLUG && (
        <div className="mt-6 max-w-3xl">
          <AccountReviewActions id={listing.id} updatedAt={listing.updatedAt.toISOString()} />
        </div>
      )}
      <section className="mt-8 max-w-3xl">
        <h2 className="mb-3 text-xl font-semibold">Descrição</h2>
        <p className="whitespace-pre-wrap text-muted-foreground">
          {listing.description}
        </p>
      </section>
    </>
  );
}
