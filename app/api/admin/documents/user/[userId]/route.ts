import { routeHandlerFetch } from "@/lib/api/fetchers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const reveal = searchParams.get("reveal");
  const query = reveal ? `?reveal=${reveal}` : "";

  return routeHandlerFetch(`/api/v1/admin/documents/user/${userId}${query}`);
}

