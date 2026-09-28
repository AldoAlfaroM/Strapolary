import "server-only";
import type Stripe from "stripe";

import { db } from "@/lib/db";

/** Idempotent: only a PENDING order moves to PAID, so webhook retries are safe. */
export async function markOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  await db().$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING", stripeCheckoutId: session.id },
      data: { status: "PAID", stripePaymentIntentId: paymentIntentId ?? null },
    });
    if (updated.count === 0) return;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });
}

export async function markOrderCancelled(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await db().order.updateMany({
    where: { id: orderId, status: "PENDING", stripeCheckoutId: session.id },
    data: { status: "CANCELLED" },
  });
}
