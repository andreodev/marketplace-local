"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import {
  createCategoryAsAdmin,
  updateCategoryAsAdmin,
} from "../services/admin-category-service";

function categoryFailure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return { error: error.issues[0].message };
  if (error instanceof AppError) return { error: error.message };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return { error: "Este slug já está em uso." };
  if (error instanceof Error && "digest" in error) throw error;
  console.error(
    "Category administration failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return { error: "Não foi possível salvar a categoria." };
}
function refreshCategories() {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/admin");
  revalidatePath("/admin/categorias");
}
export async function createCategoryAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await createCategoryAsAdmin(Object.fromEntries(formData));
  } catch (error) {
    return categoryFailure(error);
  }
  refreshCategories();
  return { success: "Categoria criada." };
}
export async function updateCategoryAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await updateCategoryAsAdmin(Object.fromEntries(formData));
  } catch (error) {
    return categoryFailure(error);
  }
  refreshCategories();
  return { success: "Categoria atualizada." };
}
