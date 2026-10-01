import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { userRepository } from "@/modules/users/repositories/user-repository";
import { loginSchema, registerSchema } from "../schemas/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import { rateLimitRepository } from "../repositories/rate-limit-repository";

async function checkRateLimit(email: string, operation: "login" | "register") {
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const key = createHash("sha256")
    .update(`${operation}:${email}:${window}`)
    .digest("hex");
  const result = await rateLimitRepository.consume(
    key,
    new Date((window + 1) * windowMs),
  );
  if (result.attempts > 10)
    throw new AppError(
      "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
    );
}

// Same KDF work for unknown emails, without creating a hash for each request.
const dummyHash = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);

export async function authenticate(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;
  await checkRateLimit(parsed.data.email, "login");
  const user = await userRepository.findCredentials(parsed.data.email);
  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? dummyHash,
  );
  if (!user || !valid || user.status !== "ACTIVE") return null;
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);
  await checkRateLimit(data.email, "register");
  const passwordHash = await hashPassword(data.password);
  try {
    return await userRepository.create({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      passwordHash,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "Não foi possível criar a conta com estes dados. Tente entrar se já possui uma conta.",
      );
    }
    throw error;
  }
}
