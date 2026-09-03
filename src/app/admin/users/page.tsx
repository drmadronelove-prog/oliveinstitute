import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { CreateUserForm } from "./CreateUserForm";
import { ResetPasswordButton } from "./ResetPasswordButton";

export default async function AdminUsersPage() {
  await requireRole(Role.ADMIN);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Manage users
      </h1>
      <p className="mb-8 max-w-prose font-serif text-sm text-[var(--color-ink-muted)]">
        Accounts are admin-created — there is no public sign-up. Set an
        initial password here and share it with the new user out of band;
        they can change it from Settings once signed in.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            All users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-serif text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-black/5 last:border-0">
                    <td className="py-3 pr-4">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{user.role}</td>
                    <td className="py-3 pr-4">
                      {user.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <ResetPasswordButton userId={user.id} />
                        <Link
                          href={`/admin/users/${user.id}/email`}
                          className="font-serif text-xs text-[var(--color-forest)] underline underline-offset-2"
                        >
                          Email
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Add a user
          </h2>
          <CreateUserForm />
        </Card>
      </div>
    </AppShell>
  );
}
