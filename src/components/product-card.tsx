import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import type { Product } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden pt-0">
      <Link href={`/products/${product.slug}`} className="block">
        <Image
          src={product.imagePath}
          alt={product.name}
          width={600}
          height={600}
          unoptimized={product.imagePath.endsWith(".svg")}
          className="aspect-square w-full bg-muted object-cover"
        />
      </Link>
      <CardContent className="space-y-1">
        <CardTitle>
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="font-medium">{formatPrice(product.priceCents, product.currency)}</CardFooter>
    </Card>
  );
}
