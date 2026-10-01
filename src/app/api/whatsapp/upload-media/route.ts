import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-org-id, x-organization-id");
  return response;
}

/**
 * Uploads media files (e.g. template image/document headers) to Vercel Blob storage with public access.
 * Returns the publicly accessible URL needed by Meta Graph API for template creation.
 */
export async function POST(request: Request) {
  try {
    const rawCentralUrl =
      process.env.UNIVERSE_API_URL ||
      process.env.NEXT_PUBLIC_UNIVERSE_API_URL ||
      process.env.NEXT_PUBLIC_UNIVERSE_SERVER_URL ||
      "http://localhost:3000";
    const centralApiUrl = rawCentralUrl.trim().replace(/\/+$/, "");

    // 1. Direct Vercel Blob Upload if token is configured locally
    const rawToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (rawToken) {
      const token = rawToken.replace(/^["']|["']$/g, "").trim() || rawToken;
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "לא נבחר קובץ להעלאה" },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      const fileObj = file as File;

      // Enforce 5MB file size limit
      const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
      if (fileObj.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "גודל הקובץ חורג מהמגבלה של 5MB" },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      const sanitizedName = (fileObj.name || "media").replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `whatsapp/templates/${Date.now()}-${sanitizedName}`;

      const arrayBuffer = await fileObj.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const blob = await put(filename, buffer, {
        access: "public",
        token: token,
        contentType: fileObj.type || "application/octet-stream",
      });

      return NextResponse.json(
        {
          success: true,
          url: blob.url,
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 2. Fallback: Proxy to Central Universe Server
    const forwardFormData = await request.formData();
    const centralRes = await fetch(`${centralApiUrl}/api/whatsapp/upload-media`, {
      method: "POST",
      body: forwardFormData,
    });

    const centralData = await centralRes.json().catch(() => null);
    if (!centralRes.ok || !centralData?.url) {
      return NextResponse.json(
        { error: centralData?.error || "העלאת הקובץ לשרת המרכזי נכשלה" },
        { status: centralRes.status || 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(centralData, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
