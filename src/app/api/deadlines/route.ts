import { getAuthUser, canWrite, SAFE_USER_SELECT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeStatus } from "@/lib/deadline-status";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const ownerId = searchParams.get("ownerId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {
    companyId: user.companyId,
  };

  if (status) {
    where.status = status;
  }
  if (category) {
    where.category = category;
  }
  if (ownerId) {
    where.ownerId = ownerId;
  }
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const deadlines = await prisma.deadline.findMany({
    where,
    include: {
      owner: { select: SAFE_USER_SELECT },
    },
    orderBy: {
      expirationDate: "asc",
    },
  });

  return NextResponse.json(deadlines);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Viewers cannot create deadlines
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "You don't have permission to create deadlines" },
      { status: 403 }
    );
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
  } = body;

  if (!title || !category || !expirationDate || !ownerId) {
    return NextResponse.json(
      { error: "Missing required fields: title, category, expirationDate, ownerId" },
      { status: 400 }
    );
  }

  if (isRecurring && (!recurringMonths || recurringMonths < 1)) {
    return NextResponse.json(
      { error: "Recurring deadlines must have a recurrence interval of at least 1 month" },
      { status: 400 }
    );
  }

  const expDate = new Date(expirationDate);
  const status = computeStatus(expDate, "active");

  const deadline = await prisma.deadline.create({
    data: {
      title,
      category,
      expirationDate: expDate,
      issueDate: issueDate ? new Date(issueDate) : null,
      notes: notes || null,
      isRecurring: isRecurring || false,
      recurringMonths: recurringMonths || null,
      ownerId,
      companyId: user.companyId,
      locationId: locationId || null,
      status,
      verificationStatus: "verified", // Manual entry — no document to verify
    },
    include: {
      owner: { select: SAFE_USER_SELECT },
    },
  });

  // Create default reminders (30, 14, 7, 3, 1, 0 days before) for the owner
  const reminderDays = [30, 14, 7, 3, 1, 0];
  await prisma.reminder.createMany({
    data: reminderDays.map((daysBefore) => ({
      type: "email",
      daysBefore,
      deadlineId: deadline.id,
      userId: ownerId,
    })),
  });

  // Create activity log entry
  await prisma.activityLog.create({
    data: {
      action: "created",
      deadlineId: deadline.id,
      userId: user.id,
    },
  });

  return NextResponse.json(deadline, { status: 201 });
}
