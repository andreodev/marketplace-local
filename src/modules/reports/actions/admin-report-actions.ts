"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { updateReportStatusAsAdmin } from "../services/admin-report-service";

export async function updateReportStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await updateReportStatusAsAdmin(Object.fromEntries(formData));
    revalidatePath("/admin");
    revalidatePath("/admin/denuncias");
    return { success: "Denúncia atualizada." };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: "Denúncia ou status inválido." };
    if (error instanceof AppError) return { error: error.message };
    if (error instanceof Error && "digest" in error) throw error;
    console.error(
      "Report moderation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível atualizar a denúncia." };
  }
}
