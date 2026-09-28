# Strapolary

An online store built as a **modular monolith**: one Next.js app and one deploy,
with the code split into modules.

| Concern | Choice |
|---|---|
| App | Next.js 16 (App Router) + React 19 + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL on Neon (or a local Postgres in Docker) |
| ORM | Prisma 7 (Neon / pg driver adapters) |
| Auth | Auth.js v5 (GitHub, Google), sessions stored in Postgres |
| Payments | Stripe Checkout (hosted page) + signed webhooks |
| Images | Local files under `public/uploads/` for now |
| Runtime | Docker (Node) **or** Cloudflare Workers (OpenNext) |

## Project layout

```
src/
  app/                  routes (pages, API routes)
    api/auth/           Auth.js endpoints
    api/stripe/webhook  Stripe webhook (marks orders paid)
    cart/ checkout/ products/
  modules/              business logic, one folder per domain
    catalog/            product queries
    cart/               cookie cart (ids + quantities only)
    orders/             checkout action, webhook fulfillment
    payments/           Stripe client
  lib/                  db, env validation, rate limiting, utils
  components/           UI (shadcn/ui in components/ui)
prisma/                 schema, migrations, seed
```

## Getting started (Docker)

1. Copy the environment template and fill it in:
   ```bash
   cp .env.example .env
   npx auth secret        # or: openssl rand -base64 33  -> AUTH_SECRET
   ```
   You need at least `AUTH_SECRET`, Stripe **test** keys, and one OAuth
   provider (GitHub is easiest: create an OAuth app with callback
   `http://localhost:3000/api/auth/callback/github`).

2. Choose a database:
   - **Neon:** put your Neon connection strings in `DATABASE_URL` (pooled) and
     `DIRECT_URL` (direct).
   - **Local Postgres:** keep the default `DATABASE_URL` and start it:
     ```bash
     docker compose --profile local-db up -d db
     ```

3. Create the tables and add sample products:
   ```bash
   docker compose --profile tools run --rm migrate
   ```

4. Start the app at http://localhost:3000:
   ```bash
   docker compose up --build app
   ```

5. Forward Stripe webhooks to your machine
   ([Stripe CLI](https://docs.stripe.com/stripe-cli)), then copy the `whsec_…`
   secret it prints into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

Test card: `4242 4242 4242 4242`, any future date, any CVC.

## Without Docker

```bash
npm install
npm run db:migrate     # needs DATABASE_URL in .env
npm run db:seed
npm run dev
```

## Deploying to Cloudflare

The same code runs on Cloudflare Workers through
[OpenNext](https://opennext.js.org/cloudflare). Use Neon there (Workers can't
reach a database inside your Docker network).

```bash
npx wrangler login
# Secrets (once):
for s in DATABASE_URL AUTH_SECRET AUTH_GITHUB_ID AUTH_GITHUB_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET APP_URL; do
  npx wrangler secret put $s
done
npm run db:deploy      # run migrations against Neon (DIRECT_URL)
npm run cf:deploy
```

Then in Stripe, add a webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook`
for `checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_succeeded` and
`checkout.session.async_payment_failed`.

Try it locally in the Workers runtime first: copy `.dev.vars.example` to
`.dev.vars` and run `npm run cf:preview`.

**Images:** Workers have no writable disk, so files in `public/uploads/` ship as
static assets at deploy time. Once you need uploads from an admin page, move
images to Cloudflare R2.

## Security

Already in the code:

- Stripe Checkout, so card data never reaches this server.
- Prices come from the database; the cart cookie holds only ids and quantities.
- Webhooks are verified by signature and handled idempotently.
- Server-side validation with Zod on every input and env var.
- Security headers on every response: CSP, HSTS, X-Frame-Options, and others (`next.config.ts`).
- Rate limits on checkout and sign-in (`src/lib/rate-limit.ts`).
- The Docker image runs as a non-root user; compose runs it read-only with all
  Linux capabilities dropped.
- Secrets live only in `.env`, `.dev.vars` or `wrangler secret`, all git-ignored.

In GitHub (`.github/`):

- **Dependabot** version updates for npm, GitHub Actions and Docker.
- **CI**: lint, typecheck, build, `npm audit`, Docker build + Trivy image scan.
- **CodeQL** code scanning (security-extended queries).
- **Dependency review** on pull requests, **gitleaks** secret scan.
- Actions are pinned to commit SHAs (Dependabot keeps them updated).

### One-time GitHub settings (do these by hand)

In **Settings → Advanced Security** (called *Code security* on some accounts):

- Turn on **Dependabot alerts** and **Dependabot security updates**.
- Turn on **Secret scanning** and **Push protection**.
- Turn on **Private vulnerability reporting**.

In **Settings → Rules → Rulesets**, protect `main`: require a pull request and
the `CI`, `CodeQL` and `Security` checks, and block force pushes.

### Cloudflare (production)

- **Security → WAF → Rate limiting rules:** limit `/api/auth/*` and `/cart`
  POSTs per IP. The in-app limiter is per isolate, so this is the real limit.
- Enable **Bot Fight Mode** and **Always Use HTTPS**.
