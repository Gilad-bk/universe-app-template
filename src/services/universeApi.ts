// UNIVERSE CORE API CLIENT
// Handles dynamic action execution and central backend communication

export interface ActionContext {
  orgId?: string;
  componentId?: string;
}

// Unified action execution engine for UI components
// Sends HTTP POST requests to backend action controller
export async function executeAction(
  actionType: string,
  payload: Record<string, any>,
  context?: ActionContext,
  token?: string
): Promise<any> {
  const baseUrl =
    process.env.NEXT_PUBLIC_UNIVERSE_API_URL ||
    process.env.UNIVERSE_API_URL ||
    (typeof window === "undefined" ? "http://localhost:3000" : "");

  const url = baseUrl ? `${baseUrl}/api/engine/execute-action` : "/api/engine/execute-action";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Provide organization context from caller context or environment fallback
  const orgId = context?.orgId || process.env.NEXT_PUBLIC_UNIVERSE_ORG_ID;
  if (orgId) {
    headers["x-org-id"] = orgId;
  }

  // Attach bearer token if caller provided an authenticated session token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        actionType,
        payload,
        componentId: context?.componentId,
        orgId,
      }),
    });

    if (!response.ok) {
      // Throw standardized Access Denied error for non-member or unauthenticated calls
      if (response.status === 401 || response.status === 403) {
        throw new Error("Access Denied");
      }

      let errorMessage = `Action execution failed (${response.status})`;
      try {
        const errData = await response.json();
        if (errData.error) {
          errorMessage = typeof errData.error === "string" ? errData.error : errData.error.message || errorMessage;
        } else if (errData.message) {
          errorMessage = errData.message;
        }
      } catch (_) {
        // Fallback to HTTP error status text if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    const resData = await response.json();
    return resData && typeof resData === "object" && "data" in resData ? resData.data : resData;
  } catch (error) {
    console.error(`[executeAction] Error executing action '${actionType}':`, error);
    throw error;
  }
}
