/**
 * Lists all superadmin accounts so we can see what email is actually in the database.
 *
 * Usage:
 *   npx tsx scripts/check-superadmin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superadmins = await prisma.user.findMany({
    where: { role: "superadmin" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      company: { select: { name: true } },
    },
  });

  if (superadmins.length === 0) {
    console.log("\nNo superadmin accounts found. Run: npm run create-superadmin\n");
  } else {
    console.log(`\nFound ${superadmins.length} superadmin(s):\n`);
    superadmins.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.firstName} ${u.lastName}`);
      console.log(`     Email:   ${u.email}`);
      console.log(`     Role:    ${u.role}`);
      console.log(`     Company: ${u.company.name}`);
      console.log(`     Created: ${u.createdAt.toISOString()}\n`);
    });
    console.log("Use the EXACT email above when logging in (case-sensitive originally — now fixed).\n");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
