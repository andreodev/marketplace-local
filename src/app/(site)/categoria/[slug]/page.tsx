import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  findCategory,
  listCategories,
} from "@/modules/categories/queries/categories";
import { ListingGrid } from "@/modules/listings/components/listing-grid";
import { ListingSearchForm } from "@/modules/listings/components/listing-search-form";
import { searchPublicListings } from "@/modules/listings/queries/listings";
import { parseListingSearch } from "@/modules/listings/schemas/search";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = { ...parseListingSearch(await searchParams), categoria: slug };
  const [category, categories, listings] = await Promise.all([
    findCategory(slug),
    listCategories(),
    searchPublicListings(search),
  ]);
  if (!category) notFound();
  return (
    <>
      <Link href="/buscar" className="text-sm text-primary">
        ← Todas as categorias
      </Link>
      <h1 className="mb-6 mt-4 text-3xl font-semibold">{category.name}</h1>
      <ListingSearchForm categories={categories} search={search} />
      <section className="mt-10">
        {listings.length ? (
          <ListingGrid listings={listings} />
        ) : (
          <Card className="text-center">
            Ainda não há anúncios ativos nesta categoria.
          </Card>
        )}
      </section>
    </>
  );
}
