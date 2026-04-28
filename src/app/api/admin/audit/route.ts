import { getAuthUser, isAdmin, SAFE_USER_SELECT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Only admins can access audit logs" },
      { status: 403 }
    );
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const days = parseInt(searchParams.get("days") || "30");
  const limit = parseInt(searchParams.get("limit") || "100");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const companyUsers = await prisma.user.findMany({
    where: { companyId: user.companyId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  const companyUserIds = companyUsers.map((u) => u.id);

  const accessWhere: Record<string, unknown> = {
    userId: { in: companyUserIds },
    createdAt: { gte: since },
  };
  if (userId) accessWhere.userId = userId;
  if (action) accessWhere.action = action;

  const accessLogs = await prisma.accessLog.findMany({
    where: accessWhere,
    include: { user: { select: SAFE_USER_SELECT } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const activityWhere: Record<string, unknown> = {
    deadline: { companyId: user.companyId },
    createdAt: { gte: since },
  };
  if (userId) activityWhere.userId = userId;
  if (action) activityWhere.action = action;

  const activityLogs = await prisma.activityLog.findMany({
    where: activityWhere,
    include: {
      user: { select: SAFE_USER_SELECT },
      deadline: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const userSummary = await Promise.all(
    companyUsers.map(async (u) => {
      const [accessCount, activityCount, lastAccess] = await Promise.all([
        prisma.accessLog.count({
          where: { userId: u.id, createdAt: { gte: since } },
        }),
        prisma.activityLog.count({
          where: {
            userId: u.id,
            deadline: { companyId: user.companyId },
            createdAt: { gte: since },
          },
        }),
        prisma.accessLog.findFirst({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      return {
        user: u,
        accessCount,
        activityCount,
        totalActions: accessCount + activityCount,
        lastActiveAt: lastAccess?.createdAt || null,
      };
    })
  );

  const actionTypes = Array.from(
    new Set([
      ...accessLogs.map((l) => l.action),
      ...activityLogs.map((l) => l.action),
    ])
  ).sort();

  return NextResponse.json({
    accessLogs,
    activityLogs,
    userSummary,
    actionTypes,
    range: {
      since: since.toISOString(),
      days,
    },
  });
}
