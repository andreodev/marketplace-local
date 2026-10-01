import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { reportRepository } from "../repositories/report-repository";
import { reportModerationSchema } from "../schemas/admin";

export async function updateReportStatusAsAdmin(input: unknown) {
  const admin = await requireAdmin();
  const data = reportModerationSchema.parse(input);
  return reportRepository.updateStatus(data.id, admin.id, data.status);
}
