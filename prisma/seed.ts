import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const categories = [
  ["Eletrônicos", "eletronicos"],
  ["Casa e móveis", "casa-e-moveis"],
  ["Moda e acessórios", "moda-e-acessorios"],
  ["Veículos", "veiculos"],
  ["Esportes e lazer", "esportes-e-lazer"],
  ["Bebês e crianças", "bebes-e-criancas"],
  ["Ferramentas", "ferramentas"],
  ["Contas digitais", "contas-digitais"],
  ["Outros", "outros"],
];
async function main() {
  for (const [sortOrder, [name, slug]] of categories.entries())
    await db.category.upsert({
      where: { slug },
      create: { name, slug, sortOrder },
      update: { name, sortOrder },
    });
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
