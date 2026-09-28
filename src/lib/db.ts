import "server-only";
import { cache } from "react";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // Neon's serverless driver talks WebSockets, which works on Node and on
  // Cloudflare Workers. A plain Postgres (e.g. the docker-compose one) uses pg.
  const adapter = new URL(connectionString).hostname.endsWith(".neon.tech")
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

const isWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// Workers cannot share I/O objects between requests, so the client is scoped
// to a request there. On Node (Docker) one client is reused for the process.
const perRequest = cache(createClient);
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
  if (isWorkers) return perRequest();
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
