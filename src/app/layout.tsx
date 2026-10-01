import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Perto — classificados locais", template: "%s | Perto" },
  description: "Encontre produtos e conecte-se com vendedores da sua região.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
