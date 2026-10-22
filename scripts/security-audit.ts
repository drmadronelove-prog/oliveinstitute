/**
 * Read-only audit of the live database, for use after a credential leak.
 *
 * Run it against production (with the *rotated* DATABASE_URL) to answer the
 * question a breach notice asks and cannot answer for you: did anybody use
 * the stolen keys against this app?
 *
 *   npx tsx scripts/security-audit.ts [--since=30d]
 *
 * It writes nothing and prints no secret — no password hashes, no token
 * hashes, no connection string. Everything it reports is something an
 * admin can already see in /admin.
 *
 * What it cannot tell you: this app keeps no audit log, so a field that was
 * changed and changed back leaves no trace. The one external
 * reconciliation it sets up for you is the PAID purchase list — every row
 * there must correspond to a real payment in the Stripe dashboard. A PAID
 * row Stripe has never heard of is a forged `checkout.session.completed`,
 * which is exactly what a leaked STRIPE_WEBHOOK_SECRET buys an attacker.
 */
import { PrismaClient, Role, EnrollmentSource, PurchaseStatus } from "@prisma/client";

const prisma = new PrismaClient();

function parseSince(argv: string[]): { since: Date; label: string } {
  const arg = argv.find((value) => value.startsWith("--since="));
  const raw = arg?.slice("--since=".length).trim() || "30d";
  const match = /^(\d+)([dh])$/.exec(raw);
  if (!match) {
    throw new Error(`--since must look like 30d or 48h, not "${raw}".`);
  }
  const amount = Number(match[1]);
  const hours = match[2] === "d" ? amount * 24 : amount;
  return {
    since: new Date(Date.now() - hours * 60 * 60 * 1000),
    label: raw,
  };
}

/** The connection target, with the credentials stripped out. */
function describeTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "DATABASE_URL is not set";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function heading(text: string) {
  console.log(`\n${text}\n${"-".repeat(text.length)}`);
}

function when(value: Date | null | undefined): string {
  return value ? value.toISOString().replace("T", " ").slice(0, 16) : "—";
}

async function privilegedAccounts() {
  heading("Privileged accounts (every ADMIN and INSTRUCTOR)");
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.INSTRUCTOR] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      emailVerifiedAt: true,
      termsAcceptedAt: true,
    },
  });
  for (const user of users) {
    // termsAcceptedAt is null only for an account that did not come through
    // /register — the seeded admin, an admin-created invite, or a row
    // written straight into the database.
    const origin = user.termsAcceptedAt ? "self-registered" : "NOT self-registered";
    console.log(
      `  ${user.role.padEnd(10)} ${user.email}  (${user.name})\n` +
        `             created ${when(user.createdAt)}  row last changed ${when(user.updatedAt)}  ` +
        `verified ${when(user.emailVerifiedAt)}  ${origin}`,
    );
  }
  console.log(`\n  ${users.length} privileged account(s).`);
  console.log(
    "  Every one of these should be someone you can name. A role you did not\n" +
      "  grant, or a 'NOT self-registered' account you did not create, is the\n" +
      "  clearest sign the database or a session secret was actually used.",
  );
}

async function recentAccounts(since: Date, label: string) {
  heading(`Accounts created in the last ${label}`);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: {
      email: true,
      role: true,
      createdAt: true,
      emailVerifiedAt: true,
      termsAcceptedAt: true,
    },
  });
  if (users.length === 0) {
    console.log("  none");
  } else {
    for (const user of users) {
      console.log(
        `  ${when(user.createdAt)}  ${user.role.padEnd(10)} ${user.email}  ` +
          `verified ${when(user.emailVerifiedAt)}  ` +
          `${user.termsAcceptedAt ? "self-registered" : "NOT self-registered"}`,
      );
    }
  }
  console.log(`\n  ${users.length} account(s).`);
}

async function accessGrants(since: Date, label: string) {
  heading("Course access grants, by how they were granted");
  const bySource = await prisma.enrollment.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  if (bySource.length === 0) {
    console.log("  no enrollments at all");
  }
  for (const row of bySource) {
    console.log(`  ${row.source.padEnd(10)} ${row._count._all}`);
  }

  // COMP is only ever written by an admin granting access by hand, so every
  // row here should be one you remember granting.
  const comped = await prisma.enrollment.findMany({
    where: { source: EnrollmentSource.COMP },
    orderBy: { grantedAt: "desc" },
    select: {
      grantedAt: true,
      user: { select: { email: true } },
      course: { select: { slug: true } },
    },
  });
  console.log(`\n  Comped (hand-granted) enrollments — ${comped.length}:`);
  for (const row of comped) {
    console.log(`    ${when(row.grantedAt)}  ${row.user.email} -> ${row.course.slug}`);
  }
  if (comped.length === 0) console.log("    none");

  // A PURCHASE-sourced enrollment whose purchase is missing or not PAID
  // should not exist: the webhook only grants access after it has marked
  // the purchase paid.
  const inconsistent = await prisma.enrollment.findMany({
    where: {
      source: EnrollmentSource.PURCHASE,
      OR: [{ purchaseId: null }, { purchase: { status: { not: PurchaseStatus.PAID } } }],
    },
    select: {
      grantedAt: true,
      user: { select: { email: true } },
      course: { select: { slug: true } },
      purchase: { select: { status: true, stripeCheckoutSessionId: true } },
    },
  });
  console.log(
    `\n  Purchase-sourced enrollments with no matching PAID purchase — ${inconsistent.length}:`,
  );
  for (const row of inconsistent) {
    console.log(
      `    ${when(row.grantedAt)}  ${row.user.email} -> ${row.course.slug}  ` +
        `purchase ${row.purchase?.status ?? "MISSING"} ${row.purchase?.stripeCheckoutSessionId ?? ""}`,
    );
  }
  if (inconsistent.length === 0) {
    console.log("    none — consistent with every grant having come from a real payment");
  }

  const recent = await prisma.enrollment.count({ where: { grantedAt: { gte: since } } });
  console.log(`\n  ${recent} enrollment(s) granted in the last ${label}.`);
}

async function purchases() {
  heading("Purchases — reconcile every PAID row against the Stripe dashboard");
  const rows = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      paidAt: true,
      refundedAt: true,
      status: true,
      amountCents: true,
      currency: true,
      stripeCheckoutSessionId: true,
      user: { select: { email: true } },
      course: { select: { slug: true } },
    },
  });
  if (rows.length === 0) {
    console.log("  no purchases — nothing to reconcile");
  }
  for (const row of rows) {
    console.log(
      `  ${when(row.createdAt)}  ${row.status.padEnd(8)} ` +
        `${(row.amountCents / 100).toFixed(2)} ${row.currency.toUpperCase()}  ` +
        `${row.user.email} -> ${row.course.slug}\n` +
        `             session ${row.stripeCheckoutSessionId}  ` +
        `paid ${when(row.paidAt)}  refunded ${when(row.refundedAt)}`,
    );
  }
  const paid = rows.filter((row) => row.status === PurchaseStatus.PAID).length;
  if (paid > 0) {
    console.log(
      `\n  ${paid} PAID purchase(s). Look each session id up in Stripe. One that\n` +
        "  Stripe has no record of was granted by a forged webhook, not a payment.",
    );
  }
}

async function tokensAndAttempts(since: Date, label: string) {
  heading(`Password-reset and verification activity in the last ${label}`);
  // Only the SHA-256 hash of each token is stored, so none of these can be
  // replayed from a stolen database row. A spike still tells you someone was
  // hammering the endpoints.
  const [resets, verifications] = await Promise.all([
    prisma.passwordResetToken.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { email: true, role: true } },
      },
    }),
    prisma.emailVerificationToken.count({ where: { createdAt: { gte: since } } }),
  ]);
  console.log(`  password reset tokens issued: ${resets.length}`);
  for (const row of resets) {
    console.log(
      `    ${when(row.createdAt)}  ${row.user.role.padEnd(10)} ${row.user.email}  ` +
        `used ${when(row.usedAt)}`,
    );
  }
  console.log(`  verification tokens issued:   ${verifications}`);

  const hits = await prisma.rateLimitHit.groupBy({
    by: ["scope"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  console.log("\n  Rate-limited attempts by scope:");
  if (hits.length === 0) console.log("    none");
  for (const row of hits) {
    console.log(`    ${row.scope.padEnd(28)} ${row._count._all}`);
  }
  console.log(
    "\n  A reset used on an ADMIN account that the admin did not request is the\n" +
      "  one entry here that means a live account takeover.",
  );
}

async function catalogueAndUploads(since: Date, label: string) {
  heading("Catalogue — status and price, as the store currently sells it");
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      status: true,
      priceCents: true,
      publishedAt: true,
      updatedAt: true,
      instructors: { select: { user: { select: { email: true } } } },
    },
  });
  for (const course of courses) {
    const price = course.priceCents === 0 ? "unpriced" : `$${(course.priceCents / 100).toFixed(2)}`;
    console.log(
      `  ${course.status.padEnd(9)} ${price.padEnd(10)} ${course.slug}\n` +
        `             published ${when(course.publishedAt)}  changed ${when(course.updatedAt)}  ` +
        `taught by ${course.instructors.map((entry) => entry.user.email).join(", ") || "nobody"}`,
    );
  }
  console.log(
    "\n  A course that is PUBLISHED and priced at 0 is given away at checkout;\n" +
      "  a price you did not set is the cheapest attack on a store like this.",
  );

  heading(`Lesson resources uploaded in the last ${label}`);
  const resources = await prisma.lessonResource.findMany({
    where: { uploadedAt: { gte: since } },
    orderBy: { uploadedAt: "desc" },
    select: {
      uploadedAt: true,
      type: true,
      title: true,
      url: true,
      uploadedBy: { select: { email: true } },
    },
  });
  if (resources.length === 0) console.log("  none");
  for (const row of resources) {
    console.log(
      `  ${when(row.uploadedAt)}  ${row.type.padEnd(5)} ${row.title}  ` +
        `by ${row.uploadedBy.email}\n             ${row.url}`,
    );
  }
}

async function main() {
  const { since, label } = parseSince(process.argv.slice(2));
  console.log(`Olive Institute security audit`);
  console.log(`database: ${describeTarget()}`);
  console.log(`window:   last ${label} (since ${since.toISOString()})`);
  console.log(`run at:   ${new Date().toISOString()}`);

  await privilegedAccounts();
  await recentAccounts(since, label);
  await accessGrants(since, label);
  await purchases();
  await tokensAndAttempts(since, label);
  await catalogueAndUploads(since, label);

  console.log(
    "\nNo audit log exists, so this is a snapshot, not a history: a value that\n" +
      "was changed and changed back leaves nothing behind. Reconcile PAID\n" +
      "purchases against Stripe, and Stream usage against Cloudflare, to cover\n" +
      "what the database alone cannot show.",
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
