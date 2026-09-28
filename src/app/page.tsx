import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/modules/catalog/queries";

// Rendered on request so the catalog always reflects the database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listProducts();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">No products yet. Run `npm run db:seed` to add some.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
