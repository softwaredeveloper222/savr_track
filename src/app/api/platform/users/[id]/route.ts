import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, role, phone, companyId } = body;

  if (role && !["admin", "member", "viewer", "superadmin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent demoting yourself from superadmin
  if (target.id === user.id && role && role !== "superadmin") {
    return NextResponse.json(
      { error: "You cannot demote your own superadmin account" },
      { status: 400 }
    );
  }

  // Validate company exists if provided
  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(role !== undefined && { role }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(companyId !== undefined && { companyId }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      company: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If target is the last superadmin, prevent deletion
  if (target.role === "superadmin") {
    const count = await prisma.user.count({ where: { role: "superadmin" } });
    if (count <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last superadmin" },
        { status: 400 }
      );
    }
  }

  try {
    // Find a fallback user in the same company to inherit deadlines.
    // Prefer admin > member > viewer.
    const fallback = await prisma.user.findFirst({
      where: { companyId: target.companyId, id: { not: id } },
      orderBy: { role: "asc" },
    });

    if (fallback) {
      // Reassign owned/handled deadlines to fallback user
      await prisma.deadline.updateMany({
        where: { ownerId: id },
        data: { ownerId: fallback.id },
      });
      await prisma.deadline.updateMany({
        where: { handledById: id },
        data: { handledById: fallback.id },
      });
    } else {
      // No fallback — user is alone in company. Delete their deadlines
      // (cascade removes documents, watchers, activityLogs, reminders).
      await prisma.deadline.deleteMany({ where: { ownerId: id } });
    }

    // Null out verifier reference on any deadlines this user verified
    await prisma.deadline.updateMany({
      where: { verifiedById: id },
      data: { verifiedById: null, verifiedAt: null },
    });

    // Clean up all records that reference this user (no automatic cascade)
    await prisma.deadlineWatcher.deleteMany({ where: { userId: id } });
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.reminder.deleteMany({ where: { userId: id } });
    await prisma.accessLog.deleteMany({ where: { userId: id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: id } });

    // Now safe to delete the user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
