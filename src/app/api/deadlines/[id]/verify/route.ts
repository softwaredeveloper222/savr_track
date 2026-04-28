import { getAuthUser, SAFE_USER_SELECT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeStatus } from "@/lib/deadline-status";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can verify
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can verify deadlines" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const deadline = await prisma.deadline.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, reviewNote, correctedData } = body as {
    action: "verify" | "flag" | "reject";
    reviewNote?: string;
    correctedData?: {
      title?: string;
      category?: string;
      expirationDate?: string;
    };
  };

  if (action === "verify") {
    // Apply corrected data if provided, then mark verified
    const updateData: Record<string, unknown> = {
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedById: user.id,
      reviewNote: reviewNote || null,
    };

    if (correctedData?.title) updateData.title = correctedData.title;
    if (correctedData?.category) updateData.category = correctedData.category;
    if (correctedData?.expirationDate) {
      updateData.expirationDate = new Date(correctedData.expirationDate);
      updateData.status = computeStatus(new Date(correctedData.expirationDate), deadline.status);
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: updateData,
      include: { owner: { select: SAFE_USER_SELECT } },
    });

    await prisma.activityLog.create({
      data: {
        action: "verified",
        details: reviewNote || "Deadline verified by admin",
        deadlineId: id,
        userId: user.id,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "flag") {
    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        verificationStatus: "needs_review",
        reviewNote: reviewNote || "Flagged for review",
      },
      include: { owner: { select: SAFE_USER_SELECT } },
    });

    await prisma.activityLog.create({
      data: {
        action: "flagged_for_review",
        details: reviewNote || "Flagged for review",
        deadlineId: id,
        userId: user.id,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "reject") {
    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        verificationStatus: "needs_review",
        reviewNote: reviewNote || "Data rejected — requires re-upload or manual correction",
      },
      include: { owner: { select: SAFE_USER_SELECT } },
    });

    await prisma.activityLog.create({
      data: {
        action: "verification_rejected",
        details: reviewNote || "Scanned data rejected",
        deadlineId: id,
        userId: user.id,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
