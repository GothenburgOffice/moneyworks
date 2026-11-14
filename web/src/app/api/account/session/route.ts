import { getAuth } from "@/lib/auth";
import { requestOrigin } from "@/lib/auth-config";
import { getDatabase } from "@/lib/db";
import { loadAccountConfig } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// What the header's account control shows, fetched by the browser after the cached
// page has loaded: only the signed-in member's email and whether to link /admin.
// Never the session token, IP or anything else Better Auth's get-session returns.
// Any failure answers "signed out" in shape, so the header falls back to Sign in.
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const signedOut = (status = 200) => Response.json({ signedIn: false }, { status, headers });

export async function GET(request: Request) {
  try {
    const config = await loadAccountConfig();
    if (!config.ready) return signedOut();
    const origin = requestOrigin(config, request.headers) || config.baseURL;
    const session = await (await getAuth(origin)).api.getSession({ headers: request.headers });
    if (!session) return signedOut();
    const user = await getDatabase().user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });
    return Response.json(
      { signedIn: true, email: session.user.email, isAdmin: Boolean(user?.isAdmin) },
      { headers },
    );
  } catch {
    // Database or auth outage: never expose the error, and let the page render signed out.
    return signedOut(503);
  }
}
