import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { updateCartAction } from "@/modules/cart/actions";
import { getProductBySlug } from "@/modules/catalog/queries";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Image
        src={product.imagePath}
        alt={product.name}
        width={800}
        height={800}
        unoptimized={product.imagePath.endsWith(".svg")}
        priority
        className="aspect-square w-full rounded-xl bg-muted object-cover"
      />
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-2xl">{formatPrice(product.priceCents, product.currency)}</p>
        <Badge variant={inStock ? "secondary" : "destructive"}>
          {inStock ? `${product.stock} in stock` : "Out of stock"}
        </Badge>
        <p className="text-muted-foreground">{product.description}</p>
        <form action={updateCartAction}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="quantity" value="1" />
          <Button size="lg" disabled={!inStock}>
            Add to cart
          </Button>
        </form>
      </div>
    </div>
  );
}
