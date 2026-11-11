import { llmsTxt } from "@/lib/commerce/discovery";

export const revalidate = 600;

export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Access-Control-Allow-Origin": "*" } });
}
