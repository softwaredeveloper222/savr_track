import { getAuthUser, isAdmin } from "@/lib/auth";
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

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Only admins can update users" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, role, phone } = body;

  if (role && !["admin", "member", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const targetUser = await prisma.user.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent removing the last admin
  if (role && targetUser.role === "admin" && role !== "admin") {
    const adminCount = await prisma.user.count({
      where: { companyId: user.companyId, role: "admin" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin. Promote another user first." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(role !== undefined && { role }),
      ...(phone !== undefined && { phone: phone || null }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      updatedAt: true,
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

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Only admins can delete users" },
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

  const targetUser = await prisma.user.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent deleting the last admin
  if (targetUser.role === "admin") {
    const adminCount = await prisma.user.count({
      where: { companyId: user.companyId, role: "admin" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin. Promote another user first." },
        { status: 400 }
      );
    }
  }

  try {
    // Find a fallback user in the same company (should always exist since we
    // blocked deleting the last admin above, but check anyway).
    const fallback = await prisma.user.findFirst({
      where: { companyId: user.companyId, id: { not: id } },
      orderBy: { role: "asc" },
    });

    if (fallback) {
      await prisma.deadline.updateMany({
        where: { ownerId: id },
        data: { ownerId: fallback.id },
      });
      await prisma.deadline.updateMany({
        where: { handledById: id },
        data: { handledById: fallback.id },
      });
    } else {
      await prisma.deadline.deleteMany({ where: { ownerId: id } });
    }

    // Null out verifier reference
    await prisma.deadline.updateMany({
      where: { verifiedById: id },
      data: { verifiedById: null, verifiedAt: null },
    });

    // Clean up referenced records
    await prisma.deadlineWatcher.deleteMany({ where: { userId: id } });
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.reminder.deleteMany({ where: { userId: id } });
    await prisma.accessLog.deleteMany({ where: { userId: id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: id } });

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
