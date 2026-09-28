# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them
privately through GitHub: **Security → Report a vulnerability** on this
repository (private vulnerability reporting). You should get a response within
a few days.

## What is in place

- Payments go through Stripe Checkout; card data never touches our servers.
- Prices are always read from the database, never from the browser.
- Stripe webhooks are verified by signature and processed idempotently.
- All user input is validated on the server with Zod.
- Security headers (CSP, HSTS, frame blocking, etc.) on every response.
- Rate limiting on checkout (plus Cloudflare WAF rules in production).
- The Docker image runs as a non-root user on a read-only filesystem.
- Dependabot, CodeQL, dependency review, gitleaks and Trivy run in CI.
