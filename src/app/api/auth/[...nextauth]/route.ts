import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const { GET } = handlers;

// Sign-in / sign-out posts: 20 per minute per IP.
export async function POST(request: NextRequest) {
  if (!rateLimit(`auth:${await clientIp()}`, 20, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }
  return handlers.POST(request);
}
