import { ListingCard } from "./listing-card";

type Listing = {
  id: string;
  slug: string;
  title: string;
  price: { toFixed: (digits: number) => string };
  city: string;
  state: string;
  condition: string;
  images: { url: string }[];
  featuredUntil?: Date | null;
};

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="flex flex-col gap-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={{
            ...listing,
            price: listing.price.toFixed(2),
            image: listing.images[0]?.url,
            featured: !!listing.featuredUntil && listing.featuredUntil > new Date(),
          }}
        />
      ))}
    </div>
  );
}
