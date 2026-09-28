import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Strapolary
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/cart">
              <ShoppingCart /> Cart
            </Link>
          </Button>
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn();
              }}
            >
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
