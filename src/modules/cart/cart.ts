import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

import { getProductsByIds } from "@/modules/catalog/queries";

const COOKIE = "cart";
const MAX_LINES = 50;
const MAX_QTY = 20;

// The cart cookie holds only product ids and quantities. Prices always come
// from the database, so tampering with the cookie cannot change what is charged.
const cartSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(MAX_QTY),
    }),
  )
  .max(MAX_LINES);

export type CartLine = z.infer<typeof cartSchema>[number];

export async function readCart(): Promise<CartLine[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]) {
  (await cookies()).set(COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart() {
  (await cookies()).delete(COOKIE);
}

export async function setQuantity(productId: string, quantity: number) {
  const lines = (await readCart()).filter((l) => l.productId !== productId);
  const qty = Math.min(Math.max(Math.trunc(quantity), 0), MAX_QTY);
  if (qty > 0) lines.push({ productId, quantity: qty });
  await writeCart(lines);
}

/** Cart lines joined with current product data; unavailable products are dropped. */
export async function getCartDetails() {
  const lines = await readCart();
  if (lines.length === 0) return { items: [], totalCents: 0 };

  const products = await getProductsByIds(lines.map((l) => l.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = lines.flatMap((line) => {
    const product = byId.get(line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  return { items, totalCents };
}
