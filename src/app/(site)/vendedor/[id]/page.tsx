import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { ListingGrid } from "@/modules/listings/components/listing-grid";
import { findPublicSeller } from "@/modules/listings/queries/listings";

export const metadata = { title: "Vendedor" };

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.cuid().safeParse(id).success) notFound();
  const seller = await findPublicSeller(id);
  if (!seller) notFound();
  const since = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(seller.createdAt);
  return (
    <>
      <Card className="flex items-center gap-5">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xl font-semibold">
          {seller.image ? (
            <Image
              src={seller.image}
              alt=""
              fill
              unoptimized
              sizes="64px"
              className="object-cover"
            />
          ) : (
            seller.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{seller.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Na plataforma desde {since}
          </p>
        </div>
      </Card>
      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-semibold">
          Anúncios de {seller.name}
        </h2>
        {seller.listings.length ? (
          <ListingGrid listings={seller.listings} />
        ) : (
          <Card className="text-center">
            Este vendedor ainda não tem anúncios ativos.
          </Card>
        )}
      </section>
    </>
  );
}
