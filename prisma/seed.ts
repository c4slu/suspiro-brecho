import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), ".env") });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error("❌ DATABASE_URL não encontrada no .env"); process.exit(1); }

const adapter = new PrismaPg({ connectionString: dbUrl! });
const prisma = new PrismaClient({ adapter });

const categorias = [
  { nome: "Vestidos", slug: "vestidos" },
  { nome: "Blusas", slug: "blusas" },
  { nome: "Calças", slug: "calcas" },
  { nome: "Jaquetas", slug: "jaquetas" },
  { nome: "Acessórios", slug: "acessorios" },
  { nome: "Calçados", slug: "calcados" },
];

const pecas = [
  {
    titulo: "Vestido Floral Vintage Anos 70",
    slug: "vestido-floral-vintage-70",
    descricao: "Vestido midi em tecido leve com estampa floral vibrante. Perfeito para o verão.",
    precoCentavos: 8900,
    tamanho: "M",
    marca: "Sem marca",
    cor: "Multicolorido",
    estado: "SEMINOVO" as const,
    medidas: "Busto 90cm · Cintura 72cm · Comprimento 105cm",
    categoriaSlug: "vestidos",
    fotoSeed: "10",
  },
  {
    titulo: "Jaqueta Jeans Levi's Clássica",
    slug: "jaqueta-jeans-levis-classica",
    descricao: "Jaqueta jeans autêntica Levi's, modelo trucker. Atemporal e versátil.",
    precoCentavos: 15500,
    tamanho: "G",
    marca: "Levi's",
    cor: "Azul",
    estado: "USADO" as const,
    medidas: "Ombro 44cm · Busto 104cm · Comprimento 57cm",
    categoriaSlug: "jaquetas",
    fotoSeed: "20",
  },
  {
    titulo: "Blusa de Tricô Rosa Pastel",
    slug: "blusa-trico-rosa-pastel",
    descricao: "Blusa de tricô artesanal em rosa pastel. Confortável e cheia de charme.",
    precoCentavos: 5500,
    tamanho: "P",
    marca: "Artesanal",
    cor: "Rosa",
    estado: "SEMINOVO" as const,
    medidas: "Busto 84cm · Comprimento 58cm",
    categoriaSlug: "blusas",
    fotoSeed: "30",
  },
  {
    titulo: "Calça Pantalona Xadrez",
    slug: "calca-pantalona-xadrez",
    descricao: "Calça pantalona de alfaiataria com estampa xadrez clássica. Elegante.",
    precoCentavos: 9900,
    tamanho: "38",
    marca: "Zara",
    cor: "Preto e Branco",
    estado: "SEMINOVO" as const,
    medidas: "Cintura 72cm · Quadril 100cm · Comprimento 102cm",
    categoriaSlug: "calcas",
    fotoSeed: "40",
  },
  {
    titulo: "Vestido Slip Dress Cetim Bege",
    slug: "vestido-slip-dress-cetim-bege",
    descricao: "Slip dress em cetim bege, midi. Minimalista e sensual. Anos 90 revival.",
    precoCentavos: 7800,
    tamanho: "P",
    marca: "Sem marca",
    cor: "Bege",
    estado: "SEMINOVO" as const,
    medidas: "Busto 82cm · Cintura 68cm · Comprimento 110cm",
    categoriaSlug: "vestidos",
    fotoSeed: "50",
  },
  {
    titulo: "Blazer Oversized Verde Musgo",
    slug: "blazer-oversized-verde-musgo",
    descricao: "Blazer oversized em tecido texturizado verde musgo. Estruturado e moderno.",
    precoCentavos: 18000,
    tamanho: "M",
    marca: "Renner",
    cor: "Verde",
    estado: "NOVO_COM_ETIQUETA" as const,
    medidas: "Ombro 46cm · Busto 108cm · Comprimento 72cm",
    categoriaSlug: "jaquetas",
    fotoSeed: "60",
  },
  {
    titulo: "Camiseta Banda Rolling Stones",
    slug: "camiseta-banda-rolling-stones",
    descricao: "Camiseta vintage da banda Rolling Stones. Desbotada no lugar certo.",
    precoCentavos: 6500,
    tamanho: "G",
    marca: "Sem marca",
    cor: "Preto",
    estado: "USADO" as const,
    medidas: "Busto 106cm · Comprimento 70cm",
    categoriaSlug: "blusas",
    fotoSeed: "70",
  },
  {
    titulo: "Saia Midi Estampada Boêmia",
    slug: "saia-midi-estampada-boemia",
    descricao: "Saia midi com estampa paisley em tons terrosos. Leve e fluida.",
    precoCentavos: 7200,
    tamanho: "M",
    marca: "Farm",
    cor: "Terracota",
    estado: "SEMINOVO" as const,
    medidas: "Cintura 70cm · Quadril 98cm · Comprimento 95cm",
    categoriaSlug: "calcas",
    fotoSeed: "80",
  },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Categorias
  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✓ Categorias criadas");

  // Peças
  for (const { categoriaSlug, fotoSeed, ...pecaData } of pecas) {
    const categoria = await prisma.categoria.findUnique({ where: { slug: categoriaSlug } });

    const peca = await prisma.peca.upsert({
      where: { slug: pecaData.slug },
      update: {},
      create: {
        ...pecaData,
        categoriaId: categoria?.id,
        fotos: {
          create: [
            { url: `https://picsum.photos/seed/${fotoSeed}/600/800`, ordem: 0 },
          ],
        },
      },
    });

    console.log(`  ✓ ${peca.titulo}`);
  }

  console.log("\n✨ Seed concluído! 8 peças prontas para teste.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); });
