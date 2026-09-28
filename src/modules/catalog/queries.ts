import "server-only";

import { db } from "@/lib/db";

export function listProducts() {
  return db().product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getProductBySlug(slug: string) {
  return db().product.findFirst({ where: { slug, active: true } });
}

export function getProductsByIds(ids: string[]) {
  return db().product.findMany({ where: { id: { in: ids }, active: true } });
}
