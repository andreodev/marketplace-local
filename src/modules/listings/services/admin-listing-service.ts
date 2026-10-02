import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { listingRepository } from "../repositories/listing-repository";
import { removeListingAsAdminSchema } from "../schemas/admin";
import { accountReviewSchema } from "../schemas/account-review";
import { ACCOUNT_CATEGORY_SLUG, assertAccountListingReady } from "../utils/account-policy";
import { mediaExists } from "@/lib/media-storage";
import { AppError } from "@/lib/errors";

export async function removeListingAsAdmin(input: unknown) {
  await requireAdmin();
  return listingRepository.removeAsAdmin(
    removeListingAsAdminSchema.parse(input).id,
  );
}

export async function reviewAccountListing(input: unknown) {
  await requireAdmin();
  const review = accountReviewSchema.parse(input);
  const listing = await listingRepository.findForAdmin(review.id);
  if (!listing || listing.status !== "PENDING_REVIEW" || listing.category.slug !== ACCOUNT_CATEGORY_SLUG)
    throw new AppError("Anúncio não encontrado na fila de revisão.");
  if (review.decision === "REJECT" && review.note.length < 10)
    throw new AppError("Explique o motivo da rejeição em pelo menos 10 caracteres.");
  if (review.decision === "APPROVE") {
    assertAccountListingReady({
      title: listing.title,
      description: listing.description,
      accountPlatform: listing.accountPlatform ?? "",
      accountType: listing.accountType ?? "",
      accountPolicyUrl: listing.accountPolicyUrl ?? "",
      accountTransferConfirmed: listing.accountTransferConfirmed,
    });
    if (!listing.images.length || listing.images.some((image) => !image.storageKey))
      throw new AppError("O anúncio precisa de fotos válidas para ser aprovado.");
    for (const image of listing.images) {
      if (!image.storageKey || !(await mediaExists(image.storageKey)))
        throw new AppError("Uma foto do anúncio não foi encontrada.");
    }
  }
  await listingRepository.reviewAccountListing(
    listing.id,
    new Date(review.updatedAt),
    review.decision === "APPROVE",
    review.note,
  );
}
