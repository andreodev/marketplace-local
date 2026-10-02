import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { states } from "../schemas/listing";
import type { ListingSearch } from "../schemas/search";

export function ListingSearchForm({
  categories,
  search,
}: {
  categories: { name: string; slug: string }[];
  search: ListingSearch;
}) {
  return (
    <form action="/buscar" className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label htmlFor="q" className="sr-only">O que você procura?</label>
        <Input
          id="q"
          name="q"
          defaultValue={search.q}
          placeholder="O que você está procurando?"
          className="h-11 bg-background"
        />
        <Button type="submit" className="h-11 px-6">
          <Search size={17} aria-hidden="true" /> Buscar anúncios
        </Button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NativeSelect name="categoria" defaultValue={search.categoria ?? ""} aria-label="Categoria" className="h-10 bg-background">
          <NativeSelectOption value="">Todas as categorias</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.slug} value={category.slug}>{category.name}</NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect name="estado" defaultValue={search.estado ?? ""} aria-label="Estado" className="h-10 bg-background">
          <NativeSelectOption value="">Todos os estados</NativeSelectOption>
          {states.map((state) => (
            <NativeSelectOption key={state} value={state}>{state}</NativeSelectOption>
          ))}
        </NativeSelect>
        <Input name="cidade" defaultValue={search.cidade} placeholder="Cidade" aria-label="Cidade" className="h-10 bg-background" />
        <NativeSelect name="condicao" defaultValue={search.condicao ?? ""} aria-label="Condição" className="h-10 bg-background">
          <NativeSelectOption value="">Novo e usado</NativeSelectOption>
          <NativeSelectOption value="NEW">Novo</NativeSelectOption>
          <NativeSelectOption value="USED">Usado</NativeSelectOption>
        </NativeSelect>
      </div>
    </form>
  );
}
