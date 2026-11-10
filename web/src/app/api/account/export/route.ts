import { buildAccountExport, exportFileName } from "@/features/account/lifecycle";
import { loadExportSource } from "@/lib/account-lifecycle";
import { getAuth } from "@/lib/auth";
import { requestOrigin } from "@/lib/auth-config";
import { loadAccountConfig } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in member's own data as a JSON download (linked from the account page).
// Only ever the session's own user: there is no user parameter to change.
export async function GET(request: Request) {
  const config = await loadAccountConfig();
  if (!config.ready) return new Response(config.problem, { status: 503 });
  const origin = requestOrigin(config, request.headers) || config.baseURL;
  const session = await (await getAuth(origin)).api.getSession({ headers: request.headers });
  const headers = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
  if (!session) return new Response(null, { status: 401, headers });
  const source = await loadExportSource(session.user.id, session.session.id);
  if (!source) return new Response(null, { status: 401, headers });
  const now = new Date();
  return new Response(`${JSON.stringify(buildAccountExport(source, now), null, 2)}\n`, {
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(now)}"`,
    },
  });
}
