import { handleAuthRequest } from "@/lib/auth-http";
import { requestOrigin } from "@/lib/auth-config";
import { loadAccountConfig } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const paths = new Set([
  "sign-up/email",
  "sign-in/email",
  "sign-out",
  "get-session",
  "verify-email",
  "send-verification-email",
  "request-password-reset",
  "reset-password",
]);
async function handle(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  const recoveryRedirect = request.method === "GET" && /^reset-password\/[^/]{1,256}$/.test(path);
  if (!paths.has(path) && !recoveryRedirect) return new Response(null, { status: 404 });
  if (
    request.method === "GET" &&
    !["get-session", "verify-email"].includes(path) &&
    !recoveryRedirect
  )
    return new Response(null, { status: 405 });
  const config = await loadAccountConfig();
  if (!config.configured) return Response.json({ error: config.problem }, { status: 503 });
  // Registration is a site setting (with mail and privacy), so Better Auth cannot check it.
  if (path === "sign-up/email" && !config.registrationEnabled)
    return Response.json({ error: "Registration is not available." }, { status: 403 });
  // A disallowed Origin falls back to APP_ORIGIN's mode; Better Auth's own
  // trusted-origin check then rejects the request.
  return handleAuthRequest(request, requestOrigin(config, request.headers) || config.baseURL);
}
export const GET = handle;
export const POST = handle;
