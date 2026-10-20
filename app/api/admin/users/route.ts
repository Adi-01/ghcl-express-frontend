import { routeHandlerFetch } from "@/lib/api/fetchers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return routeHandlerFetch(`/api/v1/admin/users${query}`);
}

