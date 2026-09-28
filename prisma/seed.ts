import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new URL(connectionString).hostname.endsWith(".neon.tech")
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const products = [
  { slug: "strapolary-tee", name: "Strapolary T-Shirt", priceCents: 2500, imagePath: "/uploads/products/tee.svg", stock: 50, description: "Soft cotton tee with the Strapolary logo." },
  { slug: "strapolary-mug", name: "Strapolary Mug", priceCents: 1400, imagePath: "/uploads/products/mug.svg", stock: 100, description: "Ceramic 11oz mug, dishwasher safe." },
  { slug: "strapolary-cap", name: "Strapolary Cap", priceCents: 2000, imagePath: "/uploads/products/cap.svg", stock: 30, description: "Adjustable six-panel cap." },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log(`Seeded ${products.length} products`);
}

main().finally(() => prisma.$disconnect());
