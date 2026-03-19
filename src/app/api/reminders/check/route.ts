import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeStatus } from "@/lib/deadline-status";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.CRON_API_KEY || "savr-cron-key";

  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all active or due_soon deadlines across all companies
    const deadlines = await prisma.deadline.findMany({
      where: {
        status: { in: ["active", "due_soon"] },
      },
    });

    let updatedCount = 0;

    for (const deadline of deadlines) {
      const newStatus = computeStatus(deadline.expirationDate, deadline.status);

      if (newStatus !== deadline.status) {
        await prisma.deadline.update({
          where: { id: deadline.id },
          data: { status: newStatus },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: "Status check complete",
      totalChecked: deadlines.length,
      updatedCount,
    });
  } catch (error) {
    console.error("Error checking deadline statuses:", error);
    return NextResponse.json(
      { error: "An error occurred while checking deadline statuses" },
      { status: 500 }
    );
  }
}
