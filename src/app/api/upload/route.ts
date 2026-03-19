import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuid } from "uuid";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const deadlineId = formData.get("deadlineId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!deadlineId) {
      return NextResponse.json({ error: "deadlineId is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: PDF, images, Word, Excel, text files." },
        { status: 400 }
      );
    }

    // Verify the deadline belongs to the user's company
    const deadline = await prisma.deadline.findFirst({
      where: { id: deadlineId, companyId: user.companyId },
    });

    if (!deadline) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
    }

    // Store in private uploads directory (not public)
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename — strip any path components from original name
    const safeName = path.basename(file.name);
    const ext = path.extname(safeName);
    const filename = `${uuid()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create Document record
    const document = await prisma.document.create({
      data: {
        filename,
        originalName: safeName,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        deadlineId,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "document_uploaded",
        details: `Uploaded file: ${safeName}`,
        deadlineId,
        userId: user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file" },
      { status: 500 }
    );
  }
}
