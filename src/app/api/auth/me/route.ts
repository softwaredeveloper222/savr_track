import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const authUser = verifyToken(token);

    if (!authUser) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch fresh user data from DB with company
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        company: {
          id: user.company.id,
          name: user.company.name,
          phone: user.company.phone,
          address: user.company.address,
          businessType: user.company.businessType,
          onboardingCompleted: user.company.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "An error occurred while checking authentication" },
      { status: 500 }
    );
  }
}
