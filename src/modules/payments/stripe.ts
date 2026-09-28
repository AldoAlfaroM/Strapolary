import "server-only";
import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | undefined;

// The fetch-based HTTP client works on both Node (Docker) and Cloudflare Workers.
export function stripe(): Stripe {
  client ??= new Stripe(env().STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  return client;
}

export const webCrypto = Stripe.createSubtleCryptoProvider();
