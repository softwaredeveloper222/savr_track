import { getAuthUser } from "@/lib/auth";
import { parseDocument } from "@/lib/document-parser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    const result = parseDocument(filename);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: "An error occurred analyzing the document" },
      { status: 500 }
    );
  }
}
