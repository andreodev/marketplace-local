import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { loginAction } from "@/modules/auth/actions/auth-actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="mx-auto max-w-md py-8">
      <h1 className="mb-3 text-3xl font-semibold">Bom ter você por perto</h1>
      <p className="mb-8 text-muted-foreground">
        Entre para cuidar dos seus anúncios.
      </p>
      {params.cadastro === "sucesso" && (
        <p className="mb-5 text-primary">
          Conta criada. Entre com seu email e senha.
        </p>
      )}
      <ActionForm
        action={loginAction}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            required: true,
            maxLength: 254,
          },
          {
            name: "password",
            label: "Senha",
            type: "password",
            autoComplete: "current-password",
            required: true,
            maxLength: 128,
          },
        ]}
        submitLabel="Entrar"
      />
      <p className="mt-6 text-sm">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="text-primary underline">
          Crie sua conta
        </Link>
      </p>
    </section>
  );
}
