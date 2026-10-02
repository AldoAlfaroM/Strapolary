import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Checkout and OAuth sign-in leave the site via form posts/redirects, so those
// origins are allowed in form-action. Everything else is same-origin only.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://github.com https://accounts.google.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  // pg loads pg-cloudflare only on Workers, so the tracer misses it; the
  // OpenNext (Cloudflare) bundle needs it present.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/**/*"],
  },
  // Turbopack's WASM loader (used by the Prisma query compiler) resolves a
  // dynamic path, so the tracer pulls in the whole project. Keep build-time
  // tooling out of the server bundle; the Workers upload has a size limit.
  outputFileTracingExcludes: {
    "/*": [
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/dev/**/*",
      "./node_modules/@prisma/engines/**/*",
      "./node_modules/@prisma/studio-core/**/*",
      "./node_modules/@electric-sql/**/*",
      "./node_modules/wrangler/**/*",
      "./node_modules/workerd/**/*",
      "./node_modules/@cloudflare/**/*",
      "./node_modules/@opennextjs/**/*",
      "./node_modules/esbuild/**/*",
      "./node_modules/@esbuild/**/*",
      "./node_modules/@next/swc-*/**/*",
      "./node_modules/lightningcss*/**/*",
      "./node_modules/@ast-grep/**/*",
      "./node_modules/typescript/**/*",
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
