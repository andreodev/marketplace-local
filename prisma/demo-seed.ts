import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não configurada.");
const host = new URL(connectionString).hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error("O catálogo de demonstração só pode ser criado em um banco local.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  ["eletronicos", "Eletrônicos"],
  ["casa-e-moveis", "Casa e móveis"],
  ["moda-e-acessorios", "Moda e acessórios"],
  ["veiculos", "Veículos"],
  ["esportes-e-lazer", "Esportes e lazer"],
  ["bebes-e-criancas", "Bebês e crianças"],
  ["ferramentas", "Ferramentas"],
  ["contas-digitais", "Contas digitais"],
  ["outros", "Outros"],
] as const;

const products = [
  { title: "Notebook 15 polegadas", price: 2150, category: "eletronicos", image: "notebook" },
  { title: "Celular 128 GB", price: 980, category: "eletronicos", image: "celular" },
  { title: "Fone de ouvido sem fio", price: 180, category: "eletronicos", image: "fone" },
  { title: "Câmera fotográfica digital", price: 1420, category: "eletronicos", image: "camera" },
  { title: "Relógio de pulso", price: 230, category: "moda-e-acessorios", image: "relogio" },
  { title: "Tênis casual", price: 190, category: "moda-e-acessorios", image: "tenis" },
  { title: "Bicicleta urbana", price: 890, category: "esportes-e-lazer", image: "bicicleta" },
  { title: "Sofá de 3 lugares", price: 1250, category: "casa-e-moveis", image: "sofa" },
  { title: "Luminária de mesa", price: 115, category: "casa-e-moveis", image: "luminaria" },
  { title: "Cadeira para sala", price: 275, category: "casa-e-moveis", image: "cadeira" },
  { title: "Mochila para viagem", price: 160, category: "moda-e-acessorios", image: "mochila" },
  { title: "Violão acústico", price: 480, category: "esportes-e-lazer", image: "violao" },
  { title: "Coleção de livros", price: 95, category: "outros", image: "livros" },
  { title: "Cafeteira para casa", price: 340, category: "casa-e-moveis", image: "cafeteira" },
  { title: "Carro hatch", price: 28500, category: "veiculos", image: "carro" },
  { title: "Moto urbana", price: 9900, category: "veiculos", image: "moto" },
  { title: "Smart TV 50 polegadas", price: 1750, category: "eletronicos", image: "tv" },
  { title: "Teclado mecânico", price: 260, category: "eletronicos", image: "teclado" },
] as const;

const details = [
  "em ótimo estado",
  "pouco usado",
  "bem conservado",
  "com acessórios",
  "pronto para usar",
  "preço para vender",
] as const;

const locations = [
  { city: "Manaus", state: "AM", neighborhood: "Centro" },
  { city: "Manaus", state: "AM", neighborhood: "Adrianópolis" },
  { city: "Manaus", state: "AM", neighborhood: "Parque 10" },
  { city: "Iranduba", state: "AM", neighborhood: "Centro" },
  { city: "Manacapuru", state: "AM", neighborhood: "Centro" },
] as const;

async function main() {
  const categoryIds = new Map<string, string>();
  for (const [sortOrder, [slug, name]] of categories.entries()) {
    const category = await db.category.upsert({
      where: { slug },
      create: { slug, name, sortOrder },
      update: {},
    });
    categoryIds.set(slug, category.id);
  }

  const seller = await db.user.upsert({
    where: { email: "catalogo-demo@perto.local" },
    create: {
      name: "Catálogo de demonstração",
      email: "catalogo-demo@perto.local",
      passwordHash: `scrypt:${randomBytes(16).toString("hex")}:${randomBytes(64).toString("hex")}`,
      whatsapp: "00000000000",
    },
    update: {},
  });

  for (let index = 0; index < 100; index++) {
    const product = products[index % products.length];
    const detail = details[Math.floor(index / products.length) % details.length];
    const location = locations[index % locations.length];
    const slug = `demo-classificado-${String(index + 1).padStart(3, "0")}`;
    const listing = await db.listing.upsert({
      where: { slug },
      create: {
        slug,
        title: product.title,
        description: `Anúncio de demonstração para visualizar o catálogo. ${product.title} ${detail}. Fotos ilustrativas.`,
        price: product.price + (index % 5) * 25,
        condition: index % 4 === 0 ? "NEW" : "USED",
        status: "ACTIVE",
        sellerId: seller.id,
        categoryId: categoryIds.get(product.category)!,
        ...location,
      },
      update: { title: product.title },
    });
    await db.listingImage.upsert({
      where: { listingId_position: { listingId: listing.id, position: 0 } },
      create: {
        listingId: listing.id,
        position: 0,
        url: `/demo-listings/${product.image}.jpg`,
      },
      update: {},
    });
  }
  console.log("100 anúncios de demonstração disponíveis.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
