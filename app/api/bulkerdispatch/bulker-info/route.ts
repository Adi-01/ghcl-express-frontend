import { routeHandlerFetch } from "@/lib/api/fetchers";

export async function GET() {
  return routeHandlerFetch("/api/v1/bulkerdispatch/bulker-info");
}

