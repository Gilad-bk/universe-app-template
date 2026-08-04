/**
 * UNIVERSE CORE API CLIENT
 * Handles dynamic action execution and central backend communication.
 */

export interface ActionContext {
  orgId?: string;
  componentId?: string;
}

/**
 * Unified action execution engine for UI components.
 * Sends HTTP POST requests to the backend action controller.
 * 
 * @param actionType - The identifier of the action (e.g., 'CREATE_RECORD', 'DELETE_RECORD', 'FETCH_RELATION')
 * @param payload - Data payload associated with the action
 * @param context - Optional context including orgId and componentId
 * @returns Parsed response data from the backend action endpoint
 */
export async function executeAction(
  actionType: string,
  payload: Record<string, any>,
  context?: ActionContext
): Promise<any> {
  const baseUrl =
    process.env.NEXT_PUBLIC_UNIVERSE_API_URL ||
    process.env.UNIVERSE_API_URL ||
    "";

  const url = baseUrl ? `${baseUrl}/api/engine/execute-action` : "/api/engine/execute-action";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (context?.orgId) {
    headers["x-org-id"] = context.orgId;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        actionType,
        payload,
        componentId: context?.componentId,
        orgId: context?.orgId,
      }),
    });

    if (!response.ok) {
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