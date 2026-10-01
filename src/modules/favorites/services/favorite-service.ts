import "server-only";
import { requireUser } from "@/modules/auth/services/session-service";
import { z } from "zod";
import { favoriteRepository } from "../repositories/favorite-repository";

export async function toggleFavorite(input: unknown) {
  const user = await requireUser();
  return favoriteRepository.toggle(user.id, z.cuid().parse(input));
}

export async function listFavorites() {
  const user = await requireUser();
  return favoriteRepository.list(user.id);
}
