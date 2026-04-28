import { getAuthUser, canWrite, SAFE_USER_SELECT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeStatus } from "@/lib/deadline-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deadline = await prisma.deadline.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      owner: { select: SAFE_USER_SELECT },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      watchers: {
        include: { user: { select: SAFE_USER_SELECT } },
      },
      documents: true,
      activityLogs: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
      reminders: true,
    },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  // Log access
  await prisma.accessLog.create({
    data: {
      action: "deadline_viewed",
      resource: `deadline:${deadline.id}`,
      userId: user.id,
    },
  });

  return NextResponse.json(deadline);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Viewers cannot update deadlines
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "You don't have permission to update deadlines" },
      { status: 403 }
    );
  }

  const existing = await prisma.deadline.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    title,
    category,
    expirationDate,
    issueDate,
    notes,
    isRecurring,
    recurringMonths,
    ownerId,
    locationId,
    handledById,
    completionNote,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (category !== undefined) updateData.category = category;
  if (expirationDate !== undefined) updateData.expirationDate = new Date(expirationDate);
  if (issueDate !== undefined) updateData.issueDate = issueDate ? new Date(issueDate) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
  if (recurringMonths !== undefined) updateData.recurringMonths = recurringMonths;
  if (ownerId !== undefined) updateData.ownerId = ownerId;
  if (locationId !== undefined) updateData.locationId = locationId || null;
  if (handledById !== undefined) updateData.handledById = handledById || null;
  if (completionNote !== undefined) updateData.completionNote = completionNote;

  // Recompute status based on expiration date (only for verified items)
  const expDate = updateData.expirationDate
    ? (updateData.expirationDate as Date)
    : existing.expirationDate;
  if (existing.verificationStatus === "verified") {
    updateData.status = computeStatus(new Date(expDate), existing.status);
  }

  const deadline = await prisma.deadline.update({
    where: { id },
    data: updateData,
    include: {
      owner: { select: SAFE_USER_SELECT },
    },
  });

  // Create activity log entry
  await prisma.activityLog.create({
    data: {
      action: "updated",
      deadlineId: id,
      userId: user.id,
    },
  });

  return NextResponse.json(deadline);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deadline = await prisma.deadline.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  // Only admin or owner can delete
  if (user.role !== "admin" && deadline.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only admin or the deadline owner can delete this deadline" },
      { status: 403 }
    );
  }

  await prisma.deadline.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Deadline deleted" });
}
