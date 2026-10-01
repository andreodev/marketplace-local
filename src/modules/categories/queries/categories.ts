import "server-only";
import { categoryRepository } from "../repositories/category-repository";

export const listCategories = () => categoryRepository.listActive();
export const findCategory = (slug: string) =>
  categoryRepository.findActiveBySlug(slug);
