import { formatPrice } from "./presentation";

export function publicationText(listing: { title: string; description: string; price: string; city: string; state: string; condition: string }, url: string) {
  return [
    listing.title,
    `${formatPrice(listing.price)} · ${listing.condition === "NEW" ? "Novo" : "Usado"} · ${listing.city}, ${listing.state}`,
    "",
    listing.description,
    "",
    `Veja o anúncio: ${url}`,
  ].join("\n");
}
