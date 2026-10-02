import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { findMyListing } from "@/modules/listings/queries/listings";
import { PublicationKit } from "@/modules/listings/components/publication-kit";

export const metadata = { title: "Divulgar anúncio" };

export default async function ShareListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.cuid().safeParse(id).success) notFound();
  const listing = await findMyListing(id);
  if (!listing || listing.status !== "ACTIVE") notFound();
  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/meus-anuncios" className="text-sm text-primary hover:underline">← Meus anúncios</Link>
      <h1 className="mt-5 text-3xl font-semibold">Divulgar anúncio</h1>
      <p className="mt-2 text-muted-foreground">Copie os dados, baixe as fotos ou compartilhe pelo celular.</p>
      <PublicationKit listing={{
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        price: listing.price.toFixed(2),
        condition: listing.condition,
        city: listing.city,
        state: listing.state,
        images: listing.images.map((image) => image.url),
      }} />
    </section>
  );
}
