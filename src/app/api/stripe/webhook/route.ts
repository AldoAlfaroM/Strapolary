import type Stripe from "stripe";

import { env } from "@/lib/env";
import { markOrderCancelled, markOrderPaid } from "@/modules/orders/fulfillment";
import { stripe, webCrypto } from "@/modules/payments/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature is computed over the raw body, so read it as text.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      body,
      signature,
      env().STRIPE_WEBHOOK_SECRET,
      undefined,
      webCrypto,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await markOrderCancelled(event.data.object);
      break;
  }

  return new Response(null, { status: 200 });
}
