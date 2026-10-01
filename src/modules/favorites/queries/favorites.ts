import "server-only";
import { getCurrentUser } from "@/modules/auth/services/session-service";
import { favoriteRepository } from "../repositories/favorite-repository";

export async function getFavoriteStatus(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  return Boolean(await favoriteRepository.find(user.id, listingId));
}

export { listFavorites } from "../services/favorite-service";
