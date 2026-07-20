import type { App } from "@/lib/types";

// Fetches app configuration from the central backend API
export async function getAppData(host: string): Promise<App | null> {

  // gets the api url
  const apiUrl = process.env.UNIVERSE_API_URL;
  if (!apiUrl) return null;

  // gets the target host or the default host
  const targetHost = process.env.NEXT_PUBLIC_DEV_HOST || host;

  try {
    // makes the api request with the target host- changed to 0 to prevent caching
    const res = await fetch(`${apiUrl}/api/app?host=${targetHost}`, {
      next: { revalidate: 0 },
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
