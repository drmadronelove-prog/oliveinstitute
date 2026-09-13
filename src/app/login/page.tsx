import { headers } from "next/headers";
import { LoginForm } from "./LoginForm";

/**
 * TEMPORARY diagnostic banner — remove once the oliveclinical.com proxy's
 * Server Action origin/host mismatch is confirmed fixed. Shows exactly what
 * this server sees on the request, with no need for platform log access.
 */
async function DebugHeaders() {
  const h = await headers();
  return (
    <div className="mb-4 w-full max-w-sm rounded-lg border-2 border-dashed border-red-400 bg-red-50 p-3 font-mono text-xs text-red-900">
      <p className="mb-1 font-bold">DEBUG-MARKER-B</p>
      <p>host: {h.get("host") ?? "(none)"}</p>
      <p>x-forwarded-host: {h.get("x-forwarded-host") ?? "(none)"}</p>
      <p>origin: {h.get("origin") ?? "(none)"}</p>
      <p>x-forwarded-proto: {h.get("x-forwarded-proto") ?? "(none)"}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <DebugHeaders />
      <LoginForm />
    </main>
  );
}
