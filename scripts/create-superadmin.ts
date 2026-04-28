/**
 * Creates or promotes a Super Admin (Platform Admin) account.
 *
 * Usage:
 *   npx tsx scripts/create-superadmin.ts
 *
 * The script will prompt for email, password, first name, last name.
 * If the email already exists, the user will be promoted to superadmin.
 * Otherwise, a new superadmin account is created in a dedicated "Platform" company.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n=== Surevia Super Admin Setup ===\n");

  const email = (await prompt("Email: ")).trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Invalid email.");
    process.exit(1);
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (existing) {
    console.log(`\nUser ${email} already exists (current role: ${existing.role}).`);
    const promote = (await prompt("Promote to superadmin? (yes/no): ")).trim().toLowerCase();

    if (promote === "yes" || promote === "y") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "superadmin" },
      });
      console.log(`\nUser ${email} has been promoted to superadmin.`);
    } else {
      console.log("Aborted.");
    }
    await prisma.$disconnect();
    return;
  }

  // Create new superadmin
  const firstName = (await prompt("First Name: ")).trim();
  const lastName = (await prompt("Last Name: ")).trim();
  const password = (await prompt("Password (min 8 chars): ")).trim();

  if (!firstName || !lastName) {
    console.error("First name and last name are required.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  // Find or create the platform company
  let platformCompany = await prisma.company.findFirst({
    where: { name: "Surevia Platform" },
  });

  if (!platformCompany) {
    platformCompany = await prisma.company.create({
      data: {
        name: "Surevia Platform",
        onboardingCompleted: true,
      },
    });
    console.log("Created internal Surevia Platform company.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const superadmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "superadmin",
      companyId: platformCompany.id,
    },
  });

  console.log(`\nSuperadmin created successfully!`);
  console.log(`   Email: ${superadmin.email}`);
  console.log(`   ID: ${superadmin.id}`);
  console.log(`\nLog in at /login with these credentials. You will be redirected to /platform.\n`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
