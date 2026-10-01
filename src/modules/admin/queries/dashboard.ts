import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { dashboardRepository } from "../repositories/dashboard-repository";

export async function getAdminDashboard() {
  await requireAdmin();
  return dashboardRepository.counts();
}
