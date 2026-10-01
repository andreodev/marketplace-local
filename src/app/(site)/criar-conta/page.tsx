import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { registerAction } from "@/modules/auth/actions/auth-actions";
export default function Register() {
  return (
    <section className="mx-auto max-w-md py-8">
      <h1 className="mb-3 text-3xl font-semibold">Faça parte da vizinhança</h1>
      <p className="mb-8 text-muted-foreground">
        Crie sua conta para começar a anunciar.
      </p>
      <ActionForm
        action={registerAction}
        fields={[
          {
            name: "name",
            label: "Nome",
            autoComplete: "name",
            required: true,
            maxLength: 100,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            required: true,
            maxLength: 254,
          },
          {
            name: "whatsapp",
            label: "WhatsApp com DDD",
            type: "tel",
            autoComplete: "tel",
            required: true,
          },
          {
            name: "password",
            label: "Senha (mínimo de 10 caracteres)",
            type: "password",
            autoComplete: "new-password",
            required: true,
            minLength: 10,
            maxLength: 128,
          },
        ]}
        submitLabel="Criar conta"
      />
      <p className="mt-6 text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-primary underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}
