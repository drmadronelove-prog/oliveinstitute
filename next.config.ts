import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  experimental: {
    // This app is reached through oliveclinical.com's own reverse-proxy
    // rewrite (see that repo's next.config.mjs), not directly. A Server
    // Action POST's Origin header is the browser's real address —
    // oliveclinical.com — which never matches this server's own
    // hostname, so Next's built-in Server Action origin check (CSRF
    // protection) rejects every login/form submission with a generic
    // error unless the proxying domain is explicitly allowed here.
    serverActions: {
      allowedOrigins: ["oliveclinical.com", "www.oliveclinical.com"],
    },
  },
  async headers() {
    return [
      {
        // Every page this app serves is per-session and database-backed;
        // none of it may be cached by an intermediary. That has to be
        // said out loud because of how this app is reached: Vercel's
        // `rewrites()` proxy at oliveclinical.com honours upstream cache
        // headers and caches proxied responses on its own CDN.
        //
        // The failure that forced this is worth describing, because it
        // looks like a bug in this app and isn't. A page URL is fetched
        // two different ways: as HTML on a reload, and as a React Server
        // Component payload when the router follows a link. Both share
        // the URL and differ only in request headers (`RSC`,
        // `Next-Router-State-Tree`, `Next-Router-Prefetch`, `Next-Url`)
        // and in the session cookie. A cache that stores one and replays
        // it for the other hands the router a body it cannot use, and
        // the router renders `not-found.tsx` from it — so clicking a
        // lesson 404s while reloading that same URL works, and the
        // Railway origin is fine throughout. Declaring the responses
        // uncacheable removes the whole class of problem rather than one
        // instance of it. (Next already sends its own `Vary` naming those
        // router headers; setting one here only overrides a correct list
        // with a hand-maintained one, so this doesn't.)
        //
        // `_next/static` and `_next/image` are excluded: those are
        // content-addressed build assets that SHOULD be cached hard, and
        // Next already sets immutable headers on them.
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
          // Next already sends a no-store `Cache-Control` of its own for
          // dynamic pages, so the line above mostly restates it. These two
          // do not restate anything: Vercel's CDN reads them in preference
          // to `Cache-Control`, and they are the only way to tell it not to
          // store a proxied response.
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
