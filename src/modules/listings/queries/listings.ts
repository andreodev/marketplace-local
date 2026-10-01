import "server-only";
import { requireUser } from "@/modules/auth/services/session-service";
import { listingRepository } from "../repositories/listing-repository";
import type { ListingSearch } from "../schemas/search";
export async function listMyListings(page = 1) {
  const user = await requireUser();
  return listingRepository.listOwned(user.id, (page - 1) * 20);
}
export async function findMyListing(id: string) {
  const user = await requireUser();
  return listingRepository.findOwned(id, user.id);
}
export const listRecentListings = () => listingRepository.recent();
export const findPublicListing = (slug: string) =>
  listingRepository.findPublic(slug);
export const searchPublicListings = (search: ListingSearch) =>
  listingRepository.searchPublic(
    {
      query: search.q,
      categorySlug: search.categoria,
      city: search.cidade,
      state: search.estado,
      condition: search.condicao,
    },
    (search.pagina - 1) * 24,
  );
export const findPublicSeller = (id: string) =>
  listingRepository.findPublicSeller(id);
