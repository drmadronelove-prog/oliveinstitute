import { requireSession } from "@/lib/rbac";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  await requireSession();

  return (
    <AppShell>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        Change password
      </h1>
      <Card className="max-w-md">
        <ChangePasswordForm />
      </Card>
    </AppShell>
  );
}
