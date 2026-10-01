import { NextResponse } from "next/server";

// Host Application Action Controller (/api/engine/execute-action)
// Standard HTTP POST endpoint for processing UI component action requests
export async function POST(request: Request) {
  try {
    const orgId = request.headers.get("x-org-id") || process.env.NEXT_PUBLIC_UNIVERSE_ORG_ID?.trim();
    const appId = request.headers.get("x-app-id") || process.env.NEXT_PUBLIC_UNIVERSE_APP_ID?.trim();
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const authHeader = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));
    const { actionType, payload, componentId, orgId: bodyOrgId, appId: bodyAppId } = body;

    const targetOrgId = orgId || bodyOrgId || payload?.orgId;
    const targetAppId = appId || bodyAppId || payload?.appId;
    const rawCentralUrl =
      process.env.UNIVERSE_API_URL ||
      process.env.NEXT_PUBLIC_UNIVERSE_API_URL ||
      process.env.NEXT_PUBLIC_UNIVERSE_SERVER_URL ||
      "http://localhost:3000";
    const centralApiUrl = rawCentralUrl.trim().replace(/\/+$/, "");

    // Forward auth, host, app, and org headers to central API endpoint
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (targetOrgId) {
      headers["x-org-id"] = targetOrgId;
    }
    if (targetAppId) {
      headers["x-app-id"] = targetAppId;
    }
    if (host) {
      headers["x-forwarded-host"] = host;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(`${centralApiUrl}/api/engine/execute-action`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        actionType,
        payload: {
          ...payload,
          ...(targetOrgId && !payload?.orgId ? { orgId: targetOrgId } : {}),
          ...(targetAppId && !payload?.appId ? { appId: targetAppId } : {}),
        },
        componentId,
        orgId: targetOrgId,
        appId: targetAppId,
      }),
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
