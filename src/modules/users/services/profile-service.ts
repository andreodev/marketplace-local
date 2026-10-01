import "server-only";
import { requireUser } from "@/modules/auth/services/session-service";
import { AppError } from "@/lib/errors";
import { profileSchema } from "../schemas/profile";
import { userRepository } from "../repositories/user-repository";

export async function updateProfile(input: unknown) {
  const user = await requireUser();
  const data = profileSchema.parse(input);
  const result = await userRepository.updateProfile(user.id, data);
  if (result.count !== 1)
    throw new AppError("Não foi possível atualizar seu perfil.");
}
