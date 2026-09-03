import Link from "next/link";
import { requireSession } from "@/lib/rbac";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

export default async function RegistrationPage() {
  const session = await requireSession();

  return (
    <AppShell activeHref="/registration">
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Course Registration
      </h1>
      <p className="mb-6 max-w-prose font-serif text-sm text-[var(--color-ink-muted)]">
        Enrollment at the Sati Center is handled by an administrator rather
        than self-service sign-up.
      </p>

      <Card className="mb-8 max-w-lg">
        <h2 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Registering for the certificate program
        </h2>
        <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
          New to the Sati Certificate Program? Registration for the program
          itself happens outside this LMS, on the Sati Center&rsquo;s
          registration form. Once you&rsquo;re registered, an administrator
          will create your LMS account.
        </p>
        <a
          href="https://pci.jotform.com/form/261964969697081"
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
        >
          Open the registration form →
        </a>
      </Card>

      <Card className="max-w-lg">
        {session.user.role === "ADMIN" ? (
          <>
            <h2 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Enroll students
            </h2>
            <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
              Create courses and enroll students from Manage courses.
            </p>
            <Link
              href="/admin/courses"
              className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
            >
              Manage courses →
            </Link>
          </>
        ) : session.user.role === "PROFESSOR" ? (
          <>
            <h2 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Need a student enrolled?
            </h2>
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              Ask an administrator to enroll them in your course from Manage
              courses.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Want to register for a course?
            </h2>
            <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
              Contact an administrator to be enrolled. Your current courses
              are on your dashboard.
            </p>
            <Link
              href="/dashboard"
              className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
            >
              Your dashboard →
            </Link>
          </>
        )}
      </Card>
    </AppShell>
  );
}
