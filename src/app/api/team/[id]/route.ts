import { getAuthUser } from "@/lib/auth";
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

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { firstName, lastName, role, phone } = body;

    // Verify the user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
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
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    // Verify the user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // Reassign deadlines to the deleting admin
    await prisma.deadline.updateMany({
      where: { ownerId: id },
      data: { ownerId: user.id },
    });
    await prisma.deadline.updateMany({
      where: { handledById: id },
      data: { handledById: user.id },
    });

    // Null out verifier reference
    await prisma.deadline.updateMany({
      where: { verifiedById: id },
      data: { verifiedById: null, verifiedAt: null },
    });

    // Clean up records that reference this user (no automatic cascade)
    await prisma.deadlineWatcher.deleteMany({ where: { userId: id } });
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.reminder.deleteMany({ where: { userId: id } });
    await prisma.accessLog.deleteMany({ where: { userId: id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: id } });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Team member removed successfully" });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the team member" },
      { status: 500 }
    );
  }
}
