# Rotating this app's secrets

Written on 2026-10-22, in response to Railway's disclosure that an
unauthorized third party may have obtained the decrypted contents of
customer environment variables. Everything this app needs to run lives in
Railway's environment variables, so the whole list below has to be treated
as leaked. Keep this as the runbook for any future rotation, not just this
one.

Two facts make this much less bad than it could be: **the store has never
taken a real payment** (Stripe is still in test mode and the only
`PUBLISHED` courses are two samples), and **there are no learner accounts
to protect** beyond the administrator's. Nothing here needs to be done
gently to avoid disrupting customers — breaking the app for an hour costs
nothing today, and that will not be true later.

## What each leaked variable buys an attacker

In the order they matter, worst first.

### 1. `NEXTAUTH_SECRET` — a complete authentication bypass

This is the urgent one. `src/lib/auth.ts` sets
`session: { strategy: "jwt" }`, and the `jwt`/`session` callbacks read the
user id and role straight off the token. The secret is what signs those
tokens, so anyone holding it can mint a session cookie that says
`role: "ADMIN"` for any user id and the app will honour it — no password,
no login form, no reset email, nothing to rate-limit. Every admin page and
every Server Action behind `requireRole` is open to whoever has this
string.

Rotating it invalidates every existing session, including any forged one.
That is the point.

### 2. `SEED_ADMIN_PASSWORD` — the administrator's actual password, in plaintext

Not a derived token: the real password for the live admin login, stored as
an environment variable because the seed needs it. Assume it is known.

There is a trap here worth reading twice. `prisma/seed.ts` upserts the
admin with `update: { ..., passwordHash }`, so **re-running the seed resets
the admin password back to whatever `SEED_ADMIN_PASSWORD` holds.** Changing
the password inside the app without also changing the variable leaves the
compromised password one `npm run db:seed` away from being restored. Change
both.

### 3. `DATABASE_URL` — full Postgres credentials

Whether this is directly exploitable depends on the hostname in the string:

- `…railway.internal` — reachable only from inside the Railway private
  network. Someone would need code running in the project to use it.
- `…proxy.rlwy.net` or `containers-us-west-….railway.app` — Railway's
  public TCP proxy. Reachable from anywhere, by anyone with the string.

Check which it is. If it is the public proxy, treat the database as having
been directly readable and writable: full read of every row (including
bcrypt password hashes), and the ability to insert an `ADMIN` user.

### 4. `STRIPE_WEBHOOK_SECRET` — forged payment confirmations

`POST /api/webhooks/stripe` is the only thing in the app that grants course
access, and it trusts an event because the signature verifies. With this
secret an attacker can sign their own `checkout.session.completed`.

The exploit is narrower than it first looks: the handler resolves the
`Purchase` row by `stripeCheckoutSessionId`, so a forged event naming a
session id that was never created finds no purchase and grants nothing. An
attacker would have to start a real checkout first (which needs a verified
account) and then forge its completion. The outcome is a free course, not a
transfer of money. Roll it anyway.

### 5. `STRIPE_SECRET_KEY` — depends entirely on test vs live

If it starts `sk_test_`, the damage is confined to test-mode data: no real
money, no real customers. If it starts `sk_live_`, it can create charges
and refunds against the real account, and that is a different kind of
morning. Check the prefix before anything else about Stripe.

### 6. `CLOUDFLARE_STREAM_TOKEN` — video account access

Scoped to whatever permissions the token was created with; at minimum it
can list, upload and delete Stream videos and run up usage billing. No
lectures have been uploaded yet, so there is no content to lose — the
exposure is billing and the token itself. (`CLOUDFLARE_ACCOUNT_ID` is an
identifier, not a credential, and does not need rotating.)

### 7. `RESEND_API_KEY` — sending mail as a verified domain

This was never set, so if it is still absent there is nothing to roll. If
it was added at any point, roll it: a stolen Resend key sends
authentic-looking mail from a domain the recipient's provider has been told
to trust, which is a phishing capability aimed at the practice's own
clients.

### Not credentials — leave them alone

`NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_NAME`, `UPLOADS_DIR`, `CERTIFICATE_ISSUER_NAME`,
`CERTIFICATE_ISSUER_LICENSE_NUMBER`, `CLOUDFLARE_ACCOUNT_ID`. These are
configuration, not secrets. Rotating them achieves nothing and breaks
things.

## Rotation, in order

Order matters: the first step shuts the open door, and the rest can take as
long as they need.

1. **Replace `NEXTAUTH_SECRET`.** Generate a new value with
   `openssl rand -base64 48` and set it in Railway → the service →
   Variables. Everyone is signed out, every forged session dies.

2. **Rotate the Postgres password.** In Railway's Postgres service, change
   the password (or delete and recreate the credential, depending on what
   the dashboard offers that day). If this app's `DATABASE_URL` is set by
   reference — the value looks like `${{Postgres.DATABASE_URL}}` — it
   follows automatically. If somebody pasted the literal connection string
   in, update it by hand or the app will not start. While in there: if the
   public TCP proxy is enabled and nothing needs it, turn it off.

3. **Change the admin password, then make the variable match.** Sign in,
   go to `/settings` → change password, pick something new. Then set
   `SEED_ADMIN_PASSWORD` in Railway to that same new value, so a future
   seed run restores the current password rather than the leaked one.

4. **Roll the Stripe keys.** Stripe dashboard → Developers → API keys →
   roll the secret key; then the webhook endpoint → roll its signing
   secret. Set the two new values in Railway. Check Stripe's own event and
   request logs for anything you did not initiate.

5. **Roll the Cloudflare Stream token.** Cloudflare dashboard → My Profile
   → API Tokens → roll (or delete and recreate, scoped to Stream only, not
   account-wide). Set the new value in Railway.

6. **`RESEND_API_KEY`**, if it was ever set: Resend dashboard → API Keys →
   delete and create a new one.

7. **Secure the Railway account itself.** The disclosure concerns Railway's
   variable storage rather than its accounts, but the cheap precautions are
   worth taking anyway: change the Railway account password, turn on
   two-factor authentication, and check Settings for project members, API
   tokens and connected integrations you do not recognise.

A note on timing: Railway paused builds during the incident, so new code
cannot ship. Changing a variable redeploys the **existing** image rather
than rebuilding, so these rotations should still take effect — but if
deploys are held too, the provider-side rotations (steps 2, 4, 5, 6) still
cut an attacker off immediately, at the cost of those features erroring
until the new values reach the app. Given that nobody is buying anything
yet, take that trade.

## Then check whether any of it was used

Rotating keys stops future access. It says nothing about what already
happened. `scripts/security-audit.ts` is a read-only pass over the database
that reports the things an attacker would have had to leave behind:

```
npx tsx scripts/security-audit.ts --since=30d
```

Run it against production with the rotated `DATABASE_URL`. It prints no
secrets — no password hashes, no token hashes, not even the connection
string — and writes nothing, so it is safe to run more than once. What to
look for:

- **An `ADMIN` or `INSTRUCTOR` account you cannot name**, or one marked
  `NOT self-registered` that you did not create yourself. This is the
  clearest evidence that either the database or the session secret was
  actually used.
- **A purchase-sourced enrollment with no matching `PAID` purchase** — the
  shape a forged webhook leaves.
- **A `PAID` purchase whose Stripe session id Stripe has no record of.**
  The script lists the ids; the reconciliation itself has to happen in the
  Stripe dashboard, because the database cannot know what Stripe thinks.
- **A password reset issued for the admin account that the admin did not
  request.**
- **A course published, or repriced to 0**, that you did not change.

The app keeps no audit log, so this is a snapshot rather than a history: a
value changed and changed back leaves nothing behind. Cross-check Stripe's
event log and Cloudflare's Stream usage for the same window to cover what
the database cannot show.

## What is not affected

The `oliveclinical` marketing site deploys on Vercel, and the only variable
it holds for this app is `INSTITUTE_ORIGIN` — a public URL, not a
credential. Nothing over there needs rotating.
