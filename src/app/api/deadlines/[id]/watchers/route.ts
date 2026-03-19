import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deadline = await prisma.deadline.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required field: userId" },
      { status: 400 }
    );
  }

  try {
    const watcher = await prisma.deadlineWatcher.create({
      data: {
        deadlineId: id,
        userId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(watcher, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "This user is already watching this deadline" },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deadline = await prisma.deadline.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required field: userId" },
      { status: 400 }
    );
  }

  await prisma.deadlineWatcher.delete({
    where: {
      deadlineId_userId: {
        deadlineId: id,
        userId,
      },
    },
  });

  return NextResponse.json({ message: "Watcher removed" });
}
