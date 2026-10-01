import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { listingRepository } from "../repositories/listing-repository";
import { removeListingAsAdminSchema } from "../schemas/admin";

export async function removeListingAsAdmin(input: unknown) {
  await requireAdmin();
  return listingRepository.removeAsAdmin(
    removeListingAsAdminSchema.parse(input).id,
  );
}
