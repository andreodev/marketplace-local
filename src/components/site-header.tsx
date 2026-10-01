import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/services/session-service";
import { logoutAction } from "@/modules/auth/actions/auth-actions";
import { Button } from "./ui/button";
export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight text-primary"
        >
          perto<span className="text-foreground">.</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <Link href="/buscar" className="px-2 text-sm">
            Buscar
          </Link>
          {user ? (
            <>
              <Link href="/perfil" className="px-2 text-sm">
                Meu perfil
              </Link>
              <Link href="/meus-anuncios" className="px-2 text-sm">
                Meus anúncios
              </Link>
              <Link href="/favoritos" className="px-2 text-sm">
                Favoritos
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/entrar">Entrar</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/meus-anuncios/novo">Anunciar produto</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
