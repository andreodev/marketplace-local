import { SiteHeader } from "@/components/site-header";
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-8 sm:py-10">
        {children}
      </main>
      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        Perto · Converse com privacidade e combine os detalhes diretamente com o vendedor.
      </footer>
    </>
  );
}
