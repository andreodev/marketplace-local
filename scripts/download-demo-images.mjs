import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const photos = {
  notebook: "photo-1517336714731-489689fd1ca8",
  celular: "photo-1511707171634-5f897ff02aa9",
  fone: "photo-1505740420928-5e560c06d30e",
  camera: "photo-1516035069371-29a1b244cc32",
  relogio: "photo-1523275335684-37898b6baf30",
  tenis: "photo-1542291026-7eec264c27ff",
  bicicleta: "photo-1485965120184-e220f721d03e",
  sofa: "photo-1555041469-a586c61ea9bc",
  luminaria: "photo-1507473885765-e6ed057f782c",
  cadeira: "photo-1503602642458-232111445657",
  mochila: "photo-1553062407-98eeb64c6a62",
  violao: "photo-1510915361894-db8b60106cb1",
  livros: "photo-1495446815901-a7297e633e8d",
  cafeteira: "photo-1511920170033-f8396924c348",
  carro: "photo-1494976388531-d1058494cdd8",
  moto: "photo-1558981806-ec527fa84c39",
  tv: "photo-1593359677879-a4bb92f829d1",
  teclado: "photo-1587829741301-dc798b83add3",
};

const directory = path.join(process.cwd(), "public", "demo-listings");
await mkdir(directory, { recursive: true });

for (const [name, photo] of Object.entries(photos)) {
  const response = await fetch(`https://images.unsplash.com/${photo}?w=720&h=540&fit=crop&q=78`);
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Não foi possível baixar a foto de ${name}: HTTP ${response.status}`);
  }
  await writeFile(path.join(directory, `${name}.jpg`), Buffer.from(await response.arrayBuffer()));
  console.log(`${name}.jpg`);
}
