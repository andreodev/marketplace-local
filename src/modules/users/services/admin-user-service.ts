import "server-only";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { userRepository } from "../repositories/user-repository";
import { userModerationSchema } from "../schemas/admin";

export async function setUserStatusAsAdmin(input: unknown) {
  const admin = await requireAdmin();
  const data = userModerationSchema.parse(input);
  if (data.id === admin.id)
    throw new AppError("Você não pode suspender sua própria conta.");
  return userRepository.setStatus(data.id, data.status);
}
