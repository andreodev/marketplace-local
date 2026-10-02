import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { listCategories } from "@/modules/categories/queries/categories";
import {
  FeaturedShowcase,
  type FeaturedCategory,
} from "@/modules/listings/components/featured-showcase";
import { ListingSearchForm } from "@/modules/listings/components/listing-search-form";
import { listFeaturedByCategory } from "@/modules/listings/queries/listings";
import { listingSearchSchema } from "@/modules/listings/schemas/search";

export default async function Home() {
  const categories = await listCategories();
  const featuredListings = await listFeaturedByCategory(
    categories.map((category) => category.id),
  );
  const showcase: FeaturedCategory[] = categories.map((category, index) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    listings: featuredListings[index].map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price.toFixed(2),
      city: listing.city,
      state: listing.state,
      image: listing.images[0]?.url,
      featured: !!listing.featuredUntil && listing.featuredUntil > new Date(),
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <section className="pb-8 pt-2 sm:pb-10">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
          <MapPin size={16} aria-hidden="true" />
          Classificados perto de você
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Encontre seu próximo achado
            </h1>
            <p className="mt-2 text-muted-foreground">
              Produtos da sua região, direto com quem está vendendo.
            </p>
          </div>
          <Button asChild className="h-11 self-start sm:self-auto">
            <Link href="/meus-anuncios/novo">
              <Plus size={17} aria-hidden="true" /> Anunciar grátis
            </Link>
          </Button>
        </div>
        <div className="mt-7">
          <ListingSearchForm
            categories={categories}
            search={listingSearchSchema.parse({})}
          />
        </div>
      </section>

      <Separator />
      <FeaturedShowcase categories={showcase} />
    </div>
  );
}
