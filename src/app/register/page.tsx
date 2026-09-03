import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";
import { RegisterForm } from "./RegisterForm";

const TITLE = "Create an account";
const DESCRIPTION = `Create a free ${SITE_NAME} account to buy courses and track your progress.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/register") },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/register"),
  },
};

export default function RegisterPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5">
          <RegisterForm />
        </div>
      </div>
    </PublicShell>
  );
}
