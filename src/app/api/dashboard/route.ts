import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { addDays, subDays } from "date-fns";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = addDays(now, 7);
  const in14Days = addDays(now, 14);
  const in30Days = addDays(now, 30);
  const thirtyDaysAgo = subDays(now, 30);

  const companyFilter = { companyId: user.companyId };

  try {
    // Overdue deadlines
    const overdueDeadlines = await prisma.deadline.findMany({
      where: {
        ...companyFilter,
        status: "overdue",
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    // Due within 7 days (active or due_soon, not overdue/completed)
    const dueSoon7 = await prisma.deadline.findMany({
      where: {
        ...companyFilter,
        status: { in: ["active", "due_soon"] },
        expirationDate: { gte: now, lte: in7Days },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    // Due within 14 days
    const dueSoon14 = await prisma.deadline.findMany({
      where: {
        ...companyFilter,
        status: { in: ["active", "due_soon"] },
        expirationDate: { gte: now, lte: in14Days },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    // Due within 30 days
    const dueSoon30 = await prisma.deadline.findMany({
      where: {
        ...companyFilter,
        status: { in: ["active", "due_soon"] },
        expirationDate: { gte: now, lte: in30Days },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    // Recently completed (last 30 days)
    const recentlyCompleted = await prisma.deadline.findMany({
      where: {
        ...companyFilter,
        status: "completed",
        completedAt: { gte: thirtyDaysAgo },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Total active deadlines
    const totalActive = await prisma.deadline.count({
      where: {
        ...companyFilter,
        status: { in: ["active", "due_soon"] },
      },
    });

    // Group by category
    const byCategory = await prisma.deadline.groupBy({
      by: ["category"],
      where: {
        ...companyFilter,
        status: { notIn: ["completed", "archived"] },
      },
      _count: { id: true },
    });

    // Group by owner
    const byOwnerRaw = await prisma.deadline.groupBy({
      by: ["ownerId"],
      where: {
        ...companyFilter,
        status: { notIn: ["completed", "archived"] },
      },
      _count: { id: true },
    });

    // Fetch owner names for the grouped results
    const ownerIds = byOwnerRaw.map((item) => item.ownerId);
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const ownerMap = new Map(owners.map((o) => [o.id, o]));
    const byOwner = byOwnerRaw.map((item) => {
      const owner = ownerMap.get(item.ownerId);
      return {
        ownerId: item.ownerId,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown",
        count: item._count.id,
      };
    });

    return NextResponse.json({
      overdue: { count: overdueDeadlines.length, items: overdueDeadlines },
      dueSoon7: { count: dueSoon7.length, items: dueSoon7 },
      dueSoon14: { count: dueSoon14.length, items: dueSoon14 },
      dueSoon30: { count: dueSoon30.length, items: dueSoon30 },
      recentlyCompleted: { count: recentlyCompleted.length, items: recentlyCompleted },
      totalActive,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
      byOwner,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching dashboard data" },
      { status: 500 }
    );
  }
}
