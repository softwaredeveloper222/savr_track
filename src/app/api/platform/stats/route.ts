import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdmin(user)) {
    return NextResponse.json(
      { error: "Forbidden: superadmin only" },
      { status: 403 }
    );
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    totalCompanies,
    totalUsers,
    totalDeadlines,
    totalDocuments,
    activeUsersLast30Days,
    deadlinesByStatus,
    usersByRole,
    recentSignups,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.deadline.count(),
    prisma.document.count(),
    prisma.user.count({
      where: {
        accessLogs: { some: { createdAt: { gte: since } } },
      },
    }),
    prisma.deadline.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: since } },
    }),
  ]);

  return NextResponse.json({
    totalCompanies,
    totalUsers,
    totalDeadlines,
    totalDocuments,
    activeUsersLast30Days,
    recentSignups,
    deadlinesByStatus: deadlinesByStatus.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    usersByRole: usersByRole.map((g) => ({
      role: g.role,
      count: g._count._all,
    })),
  });
}
