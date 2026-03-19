import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";
import { computeStatus } from "@/lib/deadline-status";

export async function POST(
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

  const body = await request.json();
  const { completionNote, handledById } = body;

  // Mark deadline as completed
  const updated = await prisma.deadline.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
      completionNote: completionNote || null,
      handledById: handledById || null,
    },
    include: {
      owner: true,
    },
  });

  // Create activity log entry
  await prisma.activityLog.create({
    data: {
      action: "completed",
      deadlineId: id,
      userId: user.id,
      details: completionNote || null,
    },
  });

  let renewedDeadline = null;

  // If recurring, create a new deadline
  if (deadline.isRecurring && deadline.recurringMonths) {
    const newExpirationDate = addMonths(
      new Date(deadline.expirationDate),
      deadline.recurringMonths
    );
    const newStatus = computeStatus(newExpirationDate, "active");

    renewedDeadline = await prisma.deadline.create({
      data: {
        title: deadline.title,
        category: deadline.category,
        expirationDate: newExpirationDate,
        issueDate: deadline.issueDate,
        notes: deadline.notes,
        isRecurring: deadline.isRecurring,
        recurringMonths: deadline.recurringMonths,
        ownerId: deadline.ownerId,
        companyId: deadline.companyId,
        locationId: deadline.locationId,
        status: newStatus,
      },
      include: {
        owner: true,
      },
    });

    // Create fresh reminders for the new deadline
    const reminderDays = [30, 14, 7, 3, 1, 0];
    await prisma.reminder.createMany({
      data: reminderDays.map((daysBefore) => ({
        type: "email",
        daysBefore,
        deadlineId: renewedDeadline!.id,
        userId: deadline.ownerId,
      })),
    });

    // Create activity log for the renewed deadline
    await prisma.activityLog.create({
      data: {
        action: "renewed",
        deadlineId: renewedDeadline.id,
        userId: user.id,
        details: `Renewed from deadline ${deadline.id}`,
      },
    });
  }

  return NextResponse.json({
    completed: updated,
    renewed: renewedDeadline,
  });
}
