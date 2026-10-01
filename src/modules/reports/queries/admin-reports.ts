import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { reportRepository } from "../repositories/report-repository";

export async function listReportsForAdmin() {
  await requireAdmin();
  return reportRepository.listForAdmin();
}
