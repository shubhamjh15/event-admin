import { serverCard } from "@/lib/commerce/discovery";

export const revalidate = 600;

export async function GET() {
  return Response.json(await serverCard(), { headers: { "Access-Control-Allow-Origin": "*" } });
}
