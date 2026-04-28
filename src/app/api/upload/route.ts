import { getAuthUser, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptBuffer } from "@/lib/encryption";
import { scanDocumentContent } from "@/lib/document-scanner";
import { computeVerificationStatus } from "@/lib/deadline-status";
import { sendEmailNotification } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuid } from "uuid";
import path from "path";
import { format } from "date-fns";

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

  // Viewers cannot upload documents
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "You don't have permission to upload documents" },
      { status: 403 }
    );
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

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: PDF, images, Word, Excel, text files." },
        { status: 400 }
      );
    }

    const deadline = await prisma.deadline.findFirst({
      where: { id: deadlineId, companyId: user.companyId },
    });

    if (!deadline) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
    }

    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeName = path.basename(file.name);
    const ext = path.extname(safeName);
    const filename = `${uuid()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Encrypt and write file
    const encryptedBuffer = encryptBuffer(buffer);
    await writeFile(filePath, encryptedBuffer);

    // Write a temporary unencrypted copy for scanning, then clean up
    const tempPath = path.join(uploadDir, `_scan_${filename}`);
    await writeFile(tempPath, buffer);

    // Scan document content
    let scanResult = null;
    try {
      scanResult = await scanDocumentContent(tempPath, file.type, safeName);
    } catch (scanError) {
      console.error("Document scan failed:", scanError);
    }

    // Clean up temp file
    try {
      const fs = await import("fs/promises");
      await fs.unlink(tempPath);
    } catch {
      // non-critical
    }

    // Create Document record with scan results
    const document = await prisma.document.create({
      data: {
        filename,
        originalName: safeName,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        encrypted: true,
        scanned: !!scanResult,
        scanConfidence: scanResult?.confidence || null,
        extractedTitle: scanResult?.extractedTitle || null,
        extractedCategory: scanResult?.extractedCategory || null,
        extractedExpDate: scanResult?.extractedExpDate || null,
        extractedText: scanResult?.extractedText || null,
        deadlineId,
      },
    });

    // Update deadline verification status based on scan confidence
    if (scanResult) {
      const verificationStatus = computeVerificationStatus(
        scanResult.confidence,
        true
      );
      await prisma.deadline.update({
        where: { id: deadlineId },
        data: {
          verificationStatus,
          scanConfidence: scanResult.confidence,
          scanData: JSON.stringify({
            title: scanResult.extractedTitle,
            category: scanResult.extractedCategory,
            expDate: scanResult.extractedExpDate,
            scannedAt: new Date().toISOString(),
          }),
        },
      });
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "document_uploaded",
        details: `Uploaded and scanned: ${safeName} (confidence: ${scanResult?.confidence || "n/a"})`,
        deadlineId,
        userId: user.id,
      },
    });

    // Log access
    await prisma.accessLog.create({
      data: {
        action: "document_uploaded",
        resource: `document:${document.id}`,
        details: `Uploaded ${safeName} to deadline ${deadline.title}`,
        userId: user.id,
      },
    });

    // Notify admins if scan confidence is low/medium (needs review)
    if (scanResult && scanResult.confidence !== "high") {
      const admins = await prisma.user.findMany({
        where: { companyId: user.companyId, role: "admin" },
      });

      for (const admin of admins) {
        await sendEmailNotification({
          to: admin.email,
          recipientName: `${admin.firstName} ${admin.lastName}`,
          deadlineTitle: deadline.title,
          deadlineId: deadline.id,
          category: deadline.category,
          expirationDate: format(new Date(deadline.expirationDate), "MMMM d, yyyy"),
          daysUntil: 0,
          type: "verification_needed",
        });
      }

      await prisma.activityLog.create({
        data: {
          action: "verification_requested",
          details: `Scan confidence: ${scanResult.confidence}. Admins notified for review.`,
          deadlineId,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({
      ...document,
      scanResult: scanResult || null,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file" },
      { status: 500 }
    );
  }
}
