import { AppError } from "@/lib/errors";

export const ACCOUNT_CATEGORY_SLUG = "contas-digitais";

export const accountTypes = ["GAME", "SERVICE", "PROFESSIONAL", "OTHER"] as const;

export const accountTypeLabels: Record<(typeof accountTypes)[number], string> = {
  GAME: "Jogo",
  SERVICE: "Serviço digital",
  PROFESSIONAL: "Perfil profissional",
  OTHER: "Outro",
};

type AccountFields = {
  title: string;
  description: string;
  accountPlatform: string;
  accountType: string;
  accountPolicyUrl: string;
  accountTransferConfirmed: boolean;
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function assertAccountListingContent(data: AccountFields) {
  const platform = normalized(`${data.accountPlatform} ${data.title}`);
  if (/\b(steam|epic(?: games)?|fortnite)\b/.test(platform)) {
    throw new AppError("Essa plataforma não permite a venda de contas.");
  }
  const publicText = `${data.title}\n${data.description}`;
  if (
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(publicText) ||
    /\b(?:senha|password|passcode|token|otp|2fa|c[oó]digo(?:s)?(?: de (?:acesso|recupera[cç][aã]o|verifica[cç][aã]o))?)\s*[:=]\s*\S+/i.test(publicText)
  ) {
    throw new AppError(
      "Não inclua e-mail, senha, token ou código de acesso no anúncio.",
    );
  }
  if (data.accountPolicyUrl) {
    try {
      const url = new URL(data.accountPolicyUrl);
      if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes("."))
        throw new Error("Invalid policy URL");
    } catch {
      throw new AppError("Informe um link HTTPS válido para as regras da plataforma.");
    }
  }
}

export function assertAccountListingReady(data: AccountFields) {
  assertAccountListingContent(data);
  if (!data.accountPlatform.trim() || !accountTypes.includes(data.accountType as (typeof accountTypes)[number])) {
    throw new AppError("Informe a plataforma e o tipo de conta.");
  }
  if (!data.accountPolicyUrl || !data.accountTransferConfirmed) {
    throw new AppError(
      "Informe as regras de transferência da plataforma e confirme que ela permite a venda.",
    );
  }
}
