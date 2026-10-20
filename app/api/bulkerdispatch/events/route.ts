import { env } from "@/config/env";
import { getSessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const token = await getSessionCookie();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = `${env.BACKEND_URL}/api/v1/bulkerdispatch/events`;

  try {
    const backendRes = await fetch(backendUrl, {
      signal: req.signal,
      headers: {
        "Jwt-Secret-Key": env.FRONTEND_SECRET_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok || !backendRes.body) {
      return new Response("Failed to connect to SSE stream", {
        status: backendRes.status || 500,
      });
    }

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      // Client closed connection cleanly
      return new Response(null, { status: 200 });
    }
    return new Response(error?.message || "Internal SSE Stream Error", {
      status: 500,
    });
  }
}
