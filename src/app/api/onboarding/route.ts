import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeStatus } from "@/lib/deadline-status";

interface OnboardingItem {
  title: string;
  category: string;
  isRecurring: boolean;
  recurringMonths: number | null;
  expirationDate: string | null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, skipOnboarding } = body as {
      items?: OnboardingItem[];
      skipOnboarding?: boolean;
    };

    // If user just wants to skip onboarding
    if (skipOnboarding) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: { onboardingCompleted: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one compliance item is required" },
        { status: 400 }
      );
    }

    // Create deadlines for each selected compliance item
    const reminderDays = [30, 14, 7, 3, 1, 0];
    let createdCount = 0;

    for (const item of items) {
      // Default expiration to 1 year from now if not provided
      const expDate = item.expirationDate
        ? new Date(item.expirationDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const status = computeStatus(expDate, "active");

      const deadline = await prisma.deadline.create({
        data: {
          title: item.title,
          category: item.category,
          expirationDate: expDate,
          isRecurring: item.isRecurring,
          recurringMonths: item.recurringMonths,
          ownerId: user.id,
          companyId: user.companyId,
          status,
          verificationStatus: "verified", // Onboarding items — manual entry, no document to verify
        },
      });

      // Create default reminders
      await prisma.reminder.createMany({
        data: reminderDays.map((daysBefore) => ({
          type: "email",
          daysBefore,
          deadlineId: deadline.id,
          userId: user.id,
        })),
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: "created",
          details: "Created during onboarding setup",
          deadlineId: deadline.id,
          userId: user.id,
        },
      });

      createdCount++;
    }

    // Mark onboarding as completed
    await prisma.company.update({
      where: { id: user.companyId },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({
      success: true,
      createdCount,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "An error occurred during onboarding setup" },
      { status: 500 }
    );
  }
}
