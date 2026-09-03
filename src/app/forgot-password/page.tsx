import type { Metadata } from "next";
import { PublicShell } from "@/components/shell/PublicShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your Olive Institute password.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5">
          <ForgotPasswordForm />
        </div>
      </div>
    </PublicShell>
  );
}
