import { getAuthUser, isAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Only admins can view all users" },
      { status: 403 }
    );
  }

  const users = await prisma.user.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ownedDeadlines: true,
          handledDeadlines: true,
          watchedDeadlines: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const [accessCount, activityCount, lastAccess] = await Promise.all([
        prisma.accessLog.count({
          where: { userId: u.id, createdAt: { gte: since } },
        }),
        prisma.activityLog.count({
          where: {
            userId: u.id,
            deadline: { companyId: user.companyId },
            createdAt: { gte: since },
          },
        }),
        prisma.accessLog.findFirst({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      return {
        ...u,
        stats: {
          accessCount,
          activityCount,
          totalActions: accessCount + activityCount,
          lastActiveAt: lastAccess?.createdAt || null,
        },
      };
    })
  );

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    users: usersWithStats,
    counts: {
      total: users.length,
      admin: roleCounts.admin || 0,
      member: roleCounts.member || 0,
      viewer: roleCounts.viewer || 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: "Only admins can create users" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email: rawEmail, password, firstName, lastName, role, phone } = body;

    if (!rawEmail || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        phone: phone || null,
        companyId: user.companyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the user" },
      { status: 500 }
    );
  }
}
