"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setQuantity } from "@/modules/cart/cart";

const input = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(0).max(20),
});

export async function updateCartAction(formData: FormData) {
  const parsed = input.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;

  await setQuantity(parsed.data.productId, parsed.data.quantity);
  revalidatePath("/cart");
}
