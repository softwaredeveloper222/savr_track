import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdmin(user)) {
    return NextResponse.json(
      { error: "Forbidden: superadmin only" },
      { status: 403 }
    );
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      businessType: true,
      onboardingCompleted: true,
      suspended: true,
      suspendedAt: true,
      suspendedReason: true,
      createdAt: true,
      _count: {
        select: { users: true, deadlines: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(companies);
}
