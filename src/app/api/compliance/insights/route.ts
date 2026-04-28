import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getComplianceItemsForType } from "@/lib/business-types";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { businessType: true },
    });

    if (!company?.businessType) {
      return NextResponse.json({
        hasBusinessType: false,
        expectedItems: [],
        coveredItems: [],
        missingItems: [],
        coverageScore: 0,
      });
    }

    const expectedItems = getComplianceItemsForType(company.businessType);

    // Get all active deadlines for this company
    const deadlines = await prisma.deadline.findMany({
      where: {
        companyId: user.companyId,
        status: { notIn: ["archived"] },
      },
      select: {
        title: true,
        category: true,
        status: true,
      },
    });

    const deadlineTitles = deadlines.map((d) => d.title.toLowerCase());
    const deadlineCategories = new Set(deadlines.map((d) => d.category));

    // Determine coverage by matching expected items to existing deadlines
    const coveredItems: string[] = [];
    const missingItems: { title: string; category: string }[] = [];

    for (const item of expectedItems) {
      // Check if a deadline exists that matches this compliance item
      const titleLower = item.title.toLowerCase();
      const isCovered = deadlineTitles.some(
        (dt) =>
          dt.includes(titleLower) ||
          titleLower.includes(dt) ||
          // Fuzzy: check key words overlap
          titleLower.split(" ").filter((w) => w.length > 3).some((w) => dt.includes(w))
      );

      if (isCovered) {
        coveredItems.push(item.title);
      } else {
        missingItems.push({ title: item.title, category: item.category });
      }
    }

    const coverageScore =
      expectedItems.length > 0
        ? Math.round((coveredItems.length / expectedItems.length) * 100)
        : 100;

    return NextResponse.json({
      hasBusinessType: true,
      businessType: company.businessType,
      expectedItems: expectedItems.map((i) => i.title),
      coveredItems,
      missingItems,
      coverageScore,
      totalExpected: expectedItems.length,
      totalCovered: coveredItems.length,
    });
  } catch (error) {
    console.error("Compliance insights error:", error);
    return NextResponse.json(
      { error: "An error occurred fetching compliance insights" },
      { status: 500 }
    );
  }
}
