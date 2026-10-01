"use server";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { createReport } from "../services/report-service";

export async function createReportAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await createReport(Object.fromEntries(formData));
    return {
      success:
        "Denúncia recebida. Obrigado por ajudar a manter a plataforma segura.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    if (error instanceof AppError) return { error: error.message };
    if (error instanceof Error && "digest" in error) throw error;
    console.error(
      "Report creation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível enviar a denúncia." };
  }
}
