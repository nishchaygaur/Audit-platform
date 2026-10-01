import { NextRequest, NextResponse } from "next/server";
import { generateAuditDossierZip } from "@/actions/dossier";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auditId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId || !auditId) {
      return NextResponse.json(
        { error: "Workspace ID and Audit ID are required" },
        { status: 400 }
      );
    }

    const result = await generateAuditDossierZip(workspaceId, auditId);
    if (!result.success || !result.zipBase64) {
      return NextResponse.json(
        { error: result.error || "Failed to compile dossier" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(result.zipBase64, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename || `audit-dossier-${auditId}.zip`}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error generating dossier";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
