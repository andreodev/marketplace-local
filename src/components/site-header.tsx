import Link from "next/link";
import { Heart, MessageCircle, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/modules/auth/services/session-service";
import { logoutAction } from "@/modules/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2" aria-label="Perto, página inicial">
          <span className="text-3xl font-extrabold tracking-tight text-primary">perto<span className="text-foreground">.</span></span>
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">classificados locais</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/buscar"><Search size={16} aria-hidden="true" /> Buscar</Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/favoritos"><Heart size={16} aria-hidden="true" /> Favoritos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/mensagens"><MessageCircle size={16} aria-hidden="true" /> Mensagens</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/meus-anuncios">Meus anúncios</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/perfil">Perfil</Link>
              </Button>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">Sair</Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/entrar">Entrar</Link>
            </Button>
          )}
          <Button asChild size="sm" className="ml-1 h-9">
            <Link href="/meus-anuncios/novo"><Plus size={16} aria-hidden="true" /> Anunciar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
