import { routeHandlerFetch } from "@/lib/api/fetchers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return routeHandlerFetch(`/api/v1/bulkerdispatch/entries/${id}`);
}

