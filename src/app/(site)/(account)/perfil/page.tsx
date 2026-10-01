import { requireUser } from "@/modules/auth/services/session-service";
import { updateProfileAction } from "@/modules/users/actions/profile-actions";
import { ActionForm } from "@/components/action-form";
export default async function Profile() {
  const user = await requireUser();
  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-3 text-3xl font-semibold">Meu perfil</h1>
      <p className="mb-8 text-muted-foreground">{user.email}</p>
      <ActionForm
        action={updateProfileAction}
        fields={[
          {
            name: "name",
            label: "Nome",
            required: true,
            maxLength: 100,
            defaultValue: user.name,
          },
          {
            name: "phone",
            label: "Telefone (opcional)",
            type: "tel",
            defaultValue: user.phone ?? "",
          },
          {
            name: "whatsapp",
            label: "WhatsApp com DDD",
            type: "tel",
            required: true,
            defaultValue: user.whatsapp,
          },
          {
            name: "image",
            label: "URL HTTPS da foto (opcional)",
            type: "url",
            defaultValue: user.image ?? "",
          },
        ]}
        submitLabel="Salvar perfil"
      />
    </section>
  );
}
