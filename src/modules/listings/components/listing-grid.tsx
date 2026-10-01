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
};

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={{
            ...listing,
            price: listing.price.toFixed(2),
            image: listing.images[0]?.url,
          }}
        />
      ))}
    </div>
  );
}
