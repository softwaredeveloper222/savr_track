import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptBuffer } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      deadline: {
        select: { companyId: true, title: true },
      },
    },
  });

  if (!document || document.deadline.companyId !== user.companyId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Log access
  await prisma.accessLog.create({
    data: {
      action: "document_downloaded",
      resource: `document:${document.id}`,
      details: `Downloaded ${document.originalName} from ${document.deadline.title}`,
      userId: user.id,
    },
  });

  try {
    const fileBuffer = await readFile(document.path);

    // Decrypt if encrypted
    const outputBuffer = document.encrypted ? decryptBuffer(fileBuffer) : fileBuffer;

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.originalName}"`,
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
