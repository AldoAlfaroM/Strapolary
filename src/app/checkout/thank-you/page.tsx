import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Thank you" };

export default function ThankYouPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Thank you for your order!</h1>
      <p className="text-muted-foreground">You will receive a confirmation email from Stripe shortly.</p>
      <Button asChild variant="outline">
        <Link href="/">Continue shopping</Link>
      </Button>
    </div>
  );
}
