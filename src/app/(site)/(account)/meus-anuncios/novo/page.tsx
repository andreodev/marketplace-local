import Link from "next/link";
import { listCategories } from "@/modules/categories/queries/categories";
import { ListingForm } from "@/modules/listings/components/listing-form";
export const metadata = { title: "Novo anúncio" };
export default async function NewListing() {
  const categories = await listCategories();
  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/meus-anuncios" className="text-sm text-primary">
        ← Meus anúncios
      </Link>
      <h1 className="mb-3 mt-6 text-3xl font-semibold">
        O próximo achado é seu
      </h1>
      <p className="mb-8 text-muted-foreground">
        Mostre seu produto e encontre alguém por perto.
      </p>
      {categories.length ? (
        <ListingForm categories={categories} />
      ) : (
        <p>Não há categorias disponíveis. Tente novamente mais tarde.</p>
      )}
    </section>
  );
}
