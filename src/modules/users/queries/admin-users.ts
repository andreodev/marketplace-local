import "server-only";
import { requireAdmin } from "@/modules/auth/services/session-service";
import { userRepository } from "../repositories/user-repository";

export async function listUsersForAdmin() {
  await requireAdmin();
  return userRepository.listForAdmin();
}

export async function findUserForAdmin(id: string) {
  await requireAdmin();
  return userRepository.findForAdmin(id);
}
