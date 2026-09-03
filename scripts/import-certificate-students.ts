import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Shared initial password for every account this script creates. */
const SHARED_PASSWORD = "password123";

/**
 * Accepted, non-withdrawn applicants from the "Certificate Student Tracking
 * Form" spreadsheet, with real emails pulled from each applicant's Jotform
 * application. Excluded: Gwen Taylor and Linda Fisher (Withdrew), and
 * Patricia Savage (Accepted but marked "withdrew" under Classes Completed —
 * ambiguous, left out; add her manually via /admin/users if that's wrong).
 *
 * "Alan Shaw" applied and signed his application as "allen shah"
 * (ashah919@pacbell.net) — same application, name recorded differently in
 * the tracking sheet vs. the applicant's own submission. Using the tracking
 * sheet's name with the applicant's real email; verify this is the same
 * person before handing out the temp password.
 */
const STUDENTS: Array<{ name: string; email: string }> = [
  { name: "Cody Lee Cochran", email: "Cody.L.Cochran@gmail.com" },
  { name: "Marga Chempolil Laube", email: "margalaube@gmail.com" },
  { name: "Dana Leigh Lyons", email: "hello@danaleighlyons.com" },
  { name: "Alan Shaw", email: "ashah919@pacbell.net" },
  { name: "Michele Topel", email: "micheletindc@gmail.com" },
  { name: "Paula Jean Snow", email: "paula.snow@gmail.com" },
  { name: "Paru Desai", email: "desaiparu526@gmail.com" },
  { name: "Alison Mark", email: "alison.mark108@gmail.com" },
  { name: "Dana Halverson", email: "halversondana@gmail.com" },
  { name: "Kodo Conlin", email: "sittingkodo@gmail.com" },
  { name: "Gaby Contreras", email: "gaby@mindfulnest.global" },
  { name: "Anna Dowling", email: "dr.anna.dowling@gmail.com" },
  { name: "Deirdre Carrigan", email: "watermoonkannon@gmail.com" },
  { name: "Jason Spees", email: "marvsirk@gmail.com" },
  { name: "Kerry Dunn", email: "dunn5226@gmail.com" },
];

async function main() {
  const results: Array<{ name: string; email: string; status: string }> = [];

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 10);

  for (const student of STUDENTS) {
    const email = student.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      results.push({ name: student.name, email, status: "already exists, skipped" });
      continue;
    }

    await prisma.user.create({
      data: { name: student.name, email, role: Role.STUDENT, passwordHash },
    });

    results.push({ name: student.name, email, status: "created" });
  }

  console.log("\nStudent accounts:\n");
  for (const r of results) {
    console.log(`${r.status === "created" ? "CREATED" : "SKIPPED"}  ${r.name.padEnd(24)}  ${r.email}`);
  }
  console.log(`\n${results.filter((r) => r.status === "created").length} created, ${results.filter((r) => r.status !== "created").length} skipped.`);
  console.log(`\nEvery created account's password is: ${SHARED_PASSWORD}`);
  console.log("They can change it at /settings/password after logging in.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
