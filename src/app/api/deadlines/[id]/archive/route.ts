import { getAuthUser, canWrite, SAFE_USER_SELECT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

  // Viewers cannot archive deadlines
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "You don't have permission to archive deadlines" },
      { status: 403 }
    );
  }

  const updated = await prisma.deadline.update({
    where: { id },
    data: {
      status: "archived",
    },
    include: {
      owner: { select: SAFE_USER_SELECT },
    },
  });

  // Create activity log entry
  await prisma.activityLog.create({
    data: {
      action: "archived",
      deadlineId: id,
      userId: user.id,
    },
  });

  return NextResponse.json(updated);
}
