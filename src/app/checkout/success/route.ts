import { NextResponse, type NextRequest } from "next/server";

import { clearCart } from "@/modules/cart/cart";
import { stripe } from "@/modules/payments/stripe";

// Stripe redirects here after payment. We only clear the cart; the order is
// marked paid by the webhook, because visiting a URL proves nothing.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const thanks = new URL("/checkout/thank-you", request.url);

  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.status === "complete") await clearCart();
    } catch {
      // Unknown session id: fall through without clearing anything.
    }
  }

  return NextResponse.redirect(thanks, { status: 303 });
}
