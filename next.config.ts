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
};

export default nextConfig;
