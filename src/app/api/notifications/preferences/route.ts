import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });

  // Return defaults if no preferences exist yet
  if (!prefs) {
    prefs = {
      id: "",
      userId: user.id,
      emailEnabled: true,
      smsEnabled: false,
      reminderDays: [30, 14, 7, 3, 1, 0],
      escalationDays: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return NextResponse.json(prefs);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { emailEnabled, smsEnabled, reminderDays, escalationDays } = body;

  const data: Record<string, unknown> = {};
  if (typeof emailEnabled === "boolean") data.emailEnabled = emailEnabled;
  if (typeof smsEnabled === "boolean") data.smsEnabled = smsEnabled;
  if (Array.isArray(reminderDays)) {
    // Validate: only allow valid reminder days
    const valid = [30, 14, 7, 3, 1, 0];
    data.reminderDays = reminderDays.filter((d: number) => valid.includes(d));
  }
  if (typeof escalationDays === "number" && escalationDays >= 1 && escalationDays <= 14) {
    data.escalationDays = escalationDays;
  }

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: {
      userId: user.id,
      emailEnabled: data.emailEnabled as boolean ?? true,
      smsEnabled: data.smsEnabled as boolean ?? false,
      reminderDays: data.reminderDays as number[] ?? [30, 14, 7, 3, 1, 0],
      escalationDays: data.escalationDays as number ?? 3,
    },
  });

  return NextResponse.json(prefs);
}
