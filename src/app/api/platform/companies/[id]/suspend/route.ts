import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(user))
    return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

  const { id } = await params;

  if (id === user.companyId) {
    return NextResponse.json(
      { error: "You cannot suspend your own (platform) company" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { suspended, reason } = body as { suspended: boolean; reason?: string };

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const updated = await prisma.company.update({
    where: { id },
    data: {
      suspended: !!suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedReason: suspended ? reason || null : null,
    },
  });

  return NextResponse.json(updated);
}
