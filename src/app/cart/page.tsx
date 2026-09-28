import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { updateCartAction } from "@/modules/cart/actions";
import { getCartDetails } from "@/modules/cart/cart";
import { checkoutAction } from "@/modules/orders/checkout";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const { items, totalCents } = await getCartDetails();

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <Button asChild variant="outline">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
      <ul className="divide-y rounded-xl border">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <Link href={`/products/${product.slug}`} className="font-medium">
                {product.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.priceCents, product.currency)} each
              </p>
            </div>
            <form action={updateCartAction} className="flex items-center gap-2">
              <input type="hidden" name="productId" value={product.id} />
              <Input
                name="quantity"
                type="number"
                min={0}
                max={20}
                defaultValue={quantity}
                className="w-20"
                aria-label={`Quantity of ${product.name}`}
              />
              <Button variant="outline" size="sm">
                Update
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg font-medium">Total: {formatPrice(totalCents, items[0].product.currency)}</p>
        <form action={checkoutAction}>
          <Button size="lg">Checkout</Button>
        </form>
      </div>
    </div>
  );
}
