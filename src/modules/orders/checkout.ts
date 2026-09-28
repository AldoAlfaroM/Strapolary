"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getCartDetails } from "@/modules/cart/cart";
import { stripe } from "@/modules/payments/stripe";

export async function checkoutAction() {
  if (!rateLimit(`checkout:${await clientIp()}`, 10, 60_000)) {
    throw new Error("Too many checkout attempts. Please wait a minute.");
  }

  const { items, totalCents } = await getCartDetails();
  if (items.length === 0) redirect("/cart");

  for (const { product, quantity } of items) {
    if (product.stock < quantity) {
      throw new Error(`Not enough stock for ${product.name}.`);
    }
  }

  const session = await auth();
  const currency = items[0].product.currency;

  // Prices are snapshotted from the database, never taken from the client.
  const order = await db().order.create({
    data: {
      userId: session?.user?.id,
      email: session?.user?.email,
      totalCents,
      currency,
      items: {
        create: items.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity,
        })),
      },
    },
  });

  const { APP_URL } = env();
  const checkout = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      customer_email: session?.user?.email ?? undefined,
      line_items: items.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: product.currency,
          unit_amount: product.priceCents,
          product_data: { name: product.name },
        },
      })),
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cart`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    { idempotencyKey: `order-${order.id}` },
  );

  await db().order.update({
    where: { id: order.id },
    data: { stripeCheckoutId: checkout.id },
  });

  if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(checkout.url);
}
