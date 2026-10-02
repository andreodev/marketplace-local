import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { listingRepository } from "../repositories/listing-repository";

export async function listListingsForAdmin() {
  await requireAdmin();
  return listingRepository.listForAdmin();
}

export async function listPendingAccountReviews() {
  await requireAdmin();
  return listingRepository.listPendingAccountReviews();
}

export async function findListingForAdmin(id: string) {
  await requireAdmin();
  return listingRepository.findForAdmin(id);
}
