import { getAuthUser } from "@/lib/auth";
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
      owner: true,
      watchers: {
        include: { user: true },
      },
      documents: true,
      activityLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      reminders: true,
    },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

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

  // Recompute status based on expiration date
  const expDate = updateData.expirationDate
    ? (updateData.expirationDate as Date)
    : existing.expirationDate;
  updateData.status = computeStatus(new Date(expDate), existing.status);

  const deadline = await prisma.deadline.update({
    where: { id },
    data: updateData,
    include: {
      owner: true,
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
