import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { states } from "../schemas/listing";
import type { ListingSearch } from "../schemas/search";

export function ListingSearchForm({
  categories,
  search,
}: {
  categories: { name: string; slug: string }[];
  search: ListingSearch;
}) {
  const selectClass =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-2 focus-visible:outline-primary";
  return (
    <form
      action="/buscar"
      className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="sm:col-span-2 lg:col-span-2">
        <label htmlFor="q" className="sr-only">
          O que você procura?
        </label>
        <Input
          id="q"
          name="q"
          defaultValue={search.q}
          placeholder="O que você procura?"
        />
      </div>
      <select
        name="categoria"
        defaultValue={search.categoria ?? ""}
        className={selectClass}
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="estado"
        defaultValue={search.estado ?? ""}
        className={selectClass}
        aria-label="Estado"
      >
        <option value="">Todo o Brasil</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
      <Button type="submit">
        <Search size={18} /> Buscar
      </Button>
      <div className="sm:col-span-2 lg:col-span-5 grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input
          name="cidade"
          defaultValue={search.cidade}
          placeholder="Cidade"
          aria-label="Cidade"
        />
        <select
          name="condicao"
          defaultValue={search.condicao ?? ""}
          className={selectClass}
          aria-label="Condição"
        >
          <option value="">Novo e usado</option>
          <option value="NEW">Novo</option>
          <option value="USED">Usado</option>
        </select>
      </div>
    </form>
  );
}
