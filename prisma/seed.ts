import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(params: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      passwordHash,
      role: params.role,
    },
  });
}

async function main() {
  const admin = await upsertUser({
    name: "Ana Admin",
    email: "admin@saticenter.org",
    password: "password123",
    role: Role.ADMIN,
  });

  const professor = await upsertUser({
    name: "Prof. Dana Wren",
    email: "professor@saticenter.org",
    password: "password123",
    role: Role.PROFESSOR,
  });

  const student = await upsertUser({
    name: "Sam Student",
    email: "student@saticenter.org",
    password: "password123",
    role: Role.STUDENT,
  });

  console.log("Seeded users:");
  console.log(`  Admin:     ${admin.email} / password123`);
  console.log(`  Professor: ${professor.email} / password123`);
  console.log(`  Student:   ${student.email} / password123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
