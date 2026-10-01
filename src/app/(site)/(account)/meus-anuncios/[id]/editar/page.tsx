import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { listCategories } from "@/modules/categories/queries/categories";
import { findMyListing } from "@/modules/listings/queries/listings";
import { ListingForm } from "@/modules/listings/components/listing-form";
export const metadata = { title: "Editar anúncio" };
export default async function EditListing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.cuid().safeParse(id).success) notFound();
  const [listing, categories] = await Promise.all([
    findMyListing(id),
    listCategories(),
  ]);
  if (!listing || !["DRAFT", "ACTIVE", "PAUSED"].includes(listing.status))
    notFound();
  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/meus-anuncios" className="text-sm text-primary">
        ← Meus anúncios
      </Link>
      <h1 className="mb-8 mt-6 text-3xl font-semibold">Editar anúncio</h1>
      <ListingForm
        categories={categories}
        initial={{
          id: listing.id,
          updatedAt: listing.updatedAt.toISOString(),
          status: listing.status,
          title: listing.title,
          description: listing.description,
          price: listing.price.toFixed(2),
          categoryId: listing.categoryId,
          condition: listing.condition,
          city: listing.city,
          state: listing.state,
          neighborhood: listing.neighborhood,
          images: listing.images.flatMap((image) =>
            image.storageKey ? [image.storageKey] : [],
          ),
        }}
      />
    </section>
  );
}
