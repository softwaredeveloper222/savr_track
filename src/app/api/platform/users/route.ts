import { getAuthUser, isSuperAdmin, hashPassword } from "@/lib/auth";
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
  const role = searchParams.get("role");
  const companyId = searchParams.get("companyId");

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (companyId) where.companyId = companyId;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: { id: true, name: true, businessType: true },
      },
      _count: {
        select: { ownedDeadlines: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Last active per user
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const [accessCount, lastAccess] = await Promise.all([
        prisma.accessLog.count({
          where: { userId: u.id, createdAt: { gte: since } },
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
          lastActiveAt: lastAccess?.createdAt || null,
        },
      };
    })
  );

  return NextResponse.json(usersWithStats);
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, phone, companyId } = body;

    if (!email || !password || !firstName || !lastName || !role || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, firstName, lastName, role, companyId" },
        { status: 400 }
      );
    }

    if (!["admin", "member", "viewer", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
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
        companyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: { select: { id: true, name: true } },
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
