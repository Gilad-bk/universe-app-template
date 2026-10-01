import type { App } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

// Fetches app configuration from the central backend API
export async function getAppData(host: string, explicitToken?: string): Promise<App | null> {
  // gets the api url
  const apiUrl = process.env.UNIVERSE_API_URL;
  if (!apiUrl) return null;

  // gets the target host or the default host
  const targetHost = process.env.NEXT_PUBLIC_DEV_HOST || host;

  const headers: Record<string, string> = {};

  let token = explicitToken;
  if (!token) {
    try {
      const { getToken } = await auth();
      token = (await getToken()) || undefined;
    } catch {
      // Not in a request context with auth (e.g., static generation or unauthenticated)
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // makes the api request with the target host - strictly bypass cache
    const res = await fetch(`${apiUrl}/api/app?host=${targetHost}`, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;

    return (await res.json()) as App;
  } catch (error) {
    console.error("Central backend connection failed:", error);
    return null;
  }
}
