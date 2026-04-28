import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(user))
    return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { users: true, deadlines: true, locations: true },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Deadline status breakdown
  const statusBreakdown = await prisma.deadline.groupBy({
    by: ["status"],
    where: { companyId: id },
    _count: { _all: true },
  });

  // Document count
  const documentCount = await prisma.document.count({
    where: { deadline: { companyId: id } },
  });

  return NextResponse.json({
    ...company,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    documentCount,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(user))
    return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, phone, address, businessType, onboardingCompleted } = body;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (name !== undefined && (!name || !name.trim())) {
    return NextResponse.json({ error: "Company name cannot be empty" }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(address !== undefined && { address: address || null }),
      ...(businessType !== undefined && { businessType: businessType || null }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(user))
    return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

  const { id } = await params;

  // Prevent deleting the superadmin's own company (the platform pseudo-company)
  if (id === user.companyId) {
    return NextResponse.json(
      { error: "You cannot delete your own (platform) company" },
      { status: 400 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id },
    include: { users: { select: { id: true } } },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    const userIds = company.users.map((u) => u.id);

    // 1. Delete all deadlines in this company.
    //    This cascades to documents, watchers, activityLogs, reminders for those deadlines.
    await prisma.deadline.deleteMany({ where: { companyId: id } });

    // 2. Clean up user-direct refs (no cascade):
    //    accessLogs, notificationPreferences
    if (userIds.length > 0) {
      await prisma.accessLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.notificationPreference.deleteMany({
        where: { userId: { in: userIds } },
      });
    }

    // 3. Delete locations
    await prisma.location.deleteMany({ where: { companyId: id } });

    // 4. Delete all users in the company
    await prisma.user.deleteMany({ where: { companyId: id } });

    // 5. Finally, delete the company itself
    await prisma.company.delete({ where: { id } });

    return NextResponse.json({
      message: "Company and all associated data deleted",
      deletedUsers: userIds.length,
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete company" },
      { status: 500 }
    );
  }
}
