"use client";
import Image from "next/image";
import { useActionState, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveListingAction,
  uploadPhotoAction,
} from "../actions/listing-actions";
import { states } from "../schemas/listing";
import { ACCOUNT_CATEGORY_SLUG, accountTypeLabels } from "../utils/account-policy";
import {
  mediaUrl,
  MAX_LISTING_IMAGES,
  assertUploadFile,
} from "../utils/media-policy";

type InitialListing = {
  id: string;
  updatedAt: string;
  status: string;
  title: string;
  description: string;
  price: string;
  categoryId: string;
  condition: string;
  city: string;
  state: string;
  neighborhood: string;
  accountPlatform: string | null;
  accountType: string | null;
  accountPolicyUrl: string | null;
  accountTransferConfirmed: boolean;
  images: string[];
};
export function ListingForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string; slug: string }[];
  initial?: InitialListing;
}) {
  const [result, action, pending] = useActionState(saveListingAction, {});
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    categoryId: initial?.categoryId ?? "",
    condition: initial?.condition ?? "USED",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    neighborhood: initial?.neighborhood ?? "",
    accountPlatform: initial?.accountPlatform ?? "",
    accountType: initial?.accountType ?? "",
    accountPolicyUrl: initial?.accountPolicyUrl ?? "",
  });
  const [images, setImages] = useState(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const busy = useRef(false);
  const [uploadError, setUploadError] = useState("");
  async function upload(files: File[]) {
    if (busy.current || !files.length) return;
    setUploadError("");
    if (images.length + files.length > MAX_LISTING_IMAGES) {
      setUploadError("Você pode adicionar até 8 fotos.");
      return;
    }
    try {
      for (const file of files) assertUploadFile(file);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Foto inválida.");
      return;
    }
    busy.current = true;
    setUploading(true);
    try {
      for (const file of files) {
        const data = new FormData();
        data.set("photo", file);
        const uploaded = await uploadPhotoAction(data);
        if (!uploaded.key) {
          setUploadError(uploaded.error ?? "Não foi possível enviar a foto.");
          break;
        }
        setImages((previous) => [...previous, uploaded.key!]);
      }
    } catch {
      setUploadError("Falha no envio. Confira sua conexão e tente novamente.");
    } finally {
      busy.current = false;
      setUploading(false);
    }
  }
  const field = (name: keyof typeof values) => ({
    id: name,
    name,
    value: values[name],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setValues((previous) => ({ ...previous, [name]: event.target.value })),
  });
  const selectClass =
    "h-12 w-full rounded-xl border border-input bg-background px-4 focus-visible:outline-2 focus-visible:outline-primary";
  const isDraft = !initial || initial.status === "DRAFT";
  const isAccount = categories.some(
    (category) => category.id === values.categoryId && category.slug === ACCOUNT_CATEGORY_SLUG,
  );
  return (
    <form action={action} className="space-y-8">
      {initial && (
        <>
          <input type="hidden" name="id" value={initial.id} />
          <input type="hidden" name="updatedAt" value={initial.updatedAt} />
        </>
      )}
      {images.map((key) => (
        <input key={key} type="hidden" name="images" value={key} />
      ))}
      <fieldset
        disabled={pending || uploading}
        className="space-y-6 disabled:opacity-75"
      >
        <legend className="mb-4 text-xl font-semibold">Sobre o produto</legend>
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Título
          </label>
          <Input
            {...field("title")}
            required
            minLength={5}
            maxLength={120}
            placeholder="Ex.: Bicicleta aro 29 em ótimo estado"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Descrição
          </label>
          <textarea
            {...field("description")}
            required
            minLength={20}
            maxLength={10000}
            rows={6}
            className="w-full rounded-xl border border-input p-4 focus-visible:outline-2 focus-visible:outline-primary"
            placeholder="Conte os detalhes, estado de conservação e o que acompanha o produto."
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium">
              Preço (R$)
            </label>
            <Input
              {...field("price")}
              required
              inputMode="decimal"
              placeholder="150,00"
              maxLength={13}
            />
          </div>
          <div>
            <label
              htmlFor="condition"
              className="mb-2 block text-sm font-medium"
            >
              Condição
            </label>
            <select {...field("condition")} className={selectClass}>
              <option value="USED">Usado</option>
              <option value="NEW">Novo</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-medium"
          >
            Categoria
          </label>
          <select {...field("categoryId")} required className={selectClass}>
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      {isAccount && (
        <fieldset disabled={pending || uploading} className="space-y-5 rounded-xl border bg-card p-5">
          <legend className="px-2 text-xl font-semibold">Sobre a conta digital</legend>
          <p className="text-sm text-muted-foreground">
            Anúncios desta categoria passam por revisão antes de aparecer na vitrine. Só anuncie contas cuja plataforma permita a transferência. Steam e Epic Games não são aceitas.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="accountPlatform" className="mb-2 block text-sm font-medium">Plataforma</label>
              <Input {...field("accountPlatform")} maxLength={80} placeholder="Nome da plataforma" />
            </div>
            <div>
              <label htmlFor="accountType" className="mb-2 block text-sm font-medium">Tipo de conta</label>
              <select {...field("accountType")} className={selectClass}>
                <option value="">Selecione</option>
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="accountPolicyUrl" className="mb-2 block text-sm font-medium">Link das regras de transferência</label>
            <Input {...field("accountPolicyUrl")} type="url" maxLength={500} placeholder="https://plataforma.com/regras" />
            <p className="mt-1 text-xs text-muted-foreground">Use uma página pública da própria plataforma que permita transferir a conta.</p>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="accountTransferConfirmed" defaultChecked={initial?.accountTransferConfirmed ?? false} className="mt-1" />
            <span>Confirmo que sou titular da conta e que sua venda ou transferência é permitida pelas regras da plataforma.</span>
          </label>
          <p className="text-sm font-medium text-red-700">Não coloque e-mail de acesso, senha, token ou código de recuperação no título, descrição ou fotos.</p>
        </fieldset>
      )}
      <fieldset disabled={pending || uploading} className="space-y-4">
        <legend className="mb-3 text-xl font-semibold">Fotos do produto</legend>
        <p className="text-sm text-muted-foreground">
          Até 8 fotos, com até 3 MB cada. JPEG, PNG ou WebP. A primeira será a
          capa.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((key, index) => (
            <div key={key} className="overflow-hidden rounded-xl border">
              <div className="relative aspect-square">
                <Image
                  src={mediaUrl(key)}
                  alt={`Foto ${index + 1} do produto`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setImages((previous) =>
                      previous.filter((image) => image !== key),
                    )
                  }
                >
                  Remover
                </Button>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setImages((previous) => [
                        key,
                        ...previous.filter((image) => image !== key),
                      ])
                    }
                  >
                    Usar como capa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <label htmlFor="photos" className="block text-sm font-medium">
          Adicionar fotos
        </label>
        <Input
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={images.length >= MAX_LISTING_IMAGES}
          className="pt-2"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
      </fieldset>
      <fieldset disabled={pending || uploading} className="space-y-5">
        <legend className="mb-3 text-xl font-semibold">
          Onde está o produto?
        </legend>
        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium">
              Cidade
            </label>
            <Input {...field("city")} required minLength={2} maxLength={100} />
          </div>
          <div>
            <label htmlFor="state" className="mb-2 block text-sm font-medium">
              Estado
            </label>
            <select {...field("state")} required className={selectClass}>
              <option value="">UF</option>
              {states.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="neighborhood"
            className="mb-2 block text-sm font-medium"
          >
            Bairro
          </label>
          <Input
            {...field("neighborhood")}
            required
            minLength={2}
            maxLength={100}
          />
        </div>
      </fieldset>
      <div aria-live="polite">
        {uploading && (
          <p className="text-sm text-primary">
            Enviando fotos… Aguarde para salvar.
          </p>
        )}
        {uploadError && (
          <p role="alert" className="text-sm text-red-700">
            {uploadError}
          </p>
        )}
        {result.error && (
          <p role="alert" className="text-sm text-red-700">
            {result.error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value={isDraft ? "ACTIVE" : "SAVE"}
          disabled={pending || uploading || !categories.length}
        >
          {pending
            ? "Salvando…"
            : isDraft
              ? "Publicar anúncio"
              : "Salvar alterações"}
        </Button>
        {isDraft && (
          <Button
            type="submit"
            name="intent"
            value="DRAFT"
            variant="outline"
            disabled={pending || uploading || !categories.length}
          >
            Salvar rascunho
          </Button>
        )}
      </div>
    </form>
  );
}
