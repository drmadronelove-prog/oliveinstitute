import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

/**
 * True only when a real secret key is configured. The checkout and webhook
 * routes check this before doing anything Stripe-shaped, so an unconfigured
 * deployment fails with one clear message instead of a cryptic auth error
 * surfacing later — and so importing this module (which `next build` does,
 * by way of the routes) never needs a live key to succeed.
 */
export const stripeConfigured = Boolean(secretKey);

// The placeholder keeps the constructor happy when unconfigured; every call
// site that can reach Stripe's API checks `stripeConfigured` first, so this
// value is never actually sent as a real request.
export const stripe = new Stripe(secretKey || "sk_test_not_configured", {
  typescript: true,
  appInfo: { name: "Olive Institute" },
});
