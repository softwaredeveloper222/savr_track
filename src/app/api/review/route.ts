import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Fetch all deadlines that need review (admin only)
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can access the review queue" },
      { status: 403 }
    );
  }

  try {
    const needsReview = await prisma.deadline.findMany({
      where: {
        companyId: user.companyId,
        verificationStatus: { in: ["uploaded", "scanned", "needs_review"] },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Also get count of items per status for the review dashboard
    const counts = {
      uploaded: 0,
      scanned: 0,
      needs_review: 0,
      total: needsReview.length,
    };

    for (const item of needsReview) {
      if (item.verificationStatus === "uploaded") counts.uploaded++;
      else if (item.verificationStatus === "scanned") counts.scanned++;
      else if (item.verificationStatus === "needs_review") counts.needs_review++;
    }

    return NextResponse.json({ items: needsReview, counts });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the review queue" },
      { status: 500 }
    );
  }
}
