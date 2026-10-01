import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { categoryRepository } from "../repositories/category-repository";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category";

export async function createCategoryAsAdmin(input: unknown) {
  await requireAdmin();
  return categoryRepository.create(createCategorySchema.parse(input));
}

export async function updateCategoryAsAdmin(input: unknown) {
  await requireAdmin();
  const { id, ...data } = updateCategorySchema.parse(input);
  return categoryRepository.update(id, data);
}
