import { checkDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await checkDatabase();
    return Response.json({ status: "ok", ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "error", message: "Database unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
