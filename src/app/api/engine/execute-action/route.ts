import { NextResponse } from "next/server";

// Host Application Action Controller (/api/engine/execute-action)
// Standard HTTP POST endpoint for processing UI component action requests
export async function POST(request: Request) {
  try {
    const orgId = request.headers.get("x-org-id") || process.env.NEXT_PUBLIC_UNIVERSE_ORG_ID;
    const authHeader = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));
    const { actionType, payload, componentId, orgId: bodyOrgId } = body;

    const targetOrgId = orgId || bodyOrgId;
    const centralApiUrl = process.env.UNIVERSE_API_URL || process.env.NEXT_PUBLIC_UNIVERSE_API_URL || "http://localhost:3000";

    // Forward auth and org headers to central API endpoint
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (targetOrgId) {
      headers["x-org-id"] = targetOrgId;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(`${centralApiUrl}/api/engine/execute-action`, {
      method: "POST",
      headers,
      body: JSON.stringify({ actionType, payload, componentId, orgId: targetOrgId }),
    });

    const resData = await response.json().catch(() => ({}));
    return NextResponse.json(resData, { status: response.status });
  } catch (error: any) {
    console.error("[Host Execute Action Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
