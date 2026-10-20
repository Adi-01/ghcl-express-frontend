import { env } from "@/config/env";
import { getSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const token = await getSessionCookie();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backendUrl = `${env.BACKEND_URL}/api/v1/admin/attendance/export?${searchParams.toString()}`;

  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        "Jwt-Secret-Key": env.FRONTEND_SECRET_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok || !backendRes.body) {
      return new Response("Failed to export attendance data", {
        status: backendRes.status || 500,
      });
    }

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="attendance_export.csv"',
      },
    });
  } catch (error: any) {
    return new Response(error?.message || "Export failed", { status: 500 });
  }
}

