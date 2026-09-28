import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role?: Role;
  }
}

// Providers are enabled only when their credentials are configured.
const providers: Provider[] = [];
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) providers.push(GitHub);
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // The adapter's types target the default @prisma/client output; ours is
  // generated into src/generated/prisma, which is structurally the same.
  adapter: PrismaAdapter(db() as never),
  providers,
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  // Behind Docker / Cloudflare the Host header is set by the proxy.
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
}));
