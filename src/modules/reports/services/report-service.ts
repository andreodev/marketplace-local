import "server-only";
import { requireUser } from "@/modules/auth/services/session-service";
import { reportSchema } from "../schemas/report";
import { reportRepository } from "../repositories/report-repository";

export async function createReport(input: unknown) {
  const user = await requireUser();
  return reportRepository.create(user.id, reportSchema.parse(input));
}
