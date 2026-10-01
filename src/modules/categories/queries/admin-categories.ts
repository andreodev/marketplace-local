import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { categoryRepository } from "../repositories/category-repository";

export async function listCategoriesForAdmin() {
  await requireAdmin();
  return categoryRepository.listForAdmin();
}
