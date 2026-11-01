import { NextResponse } from "next/server";
import { boundedBody, handleAuthRequest } from "@/lib/auth-http";
import { accountConfig, validEmail } from "@/lib/auth-config";
import { currentAdmin, ensureAdmin, isBootstrapLogin } from "@/lib/admin";
import { getDatabase } from "@/lib/db";
import { encryptionReady } from "@/lib/secrets";
import { loadAccountSettings, saveSettings } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Native form posts from /admin. Same origin, size and type checks as the account forms.
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!["login", "logout", "settings"].includes(action)) return new Response(null, { status: 404 });
  const config = accountConfig();
  if (!config.ready) return new Response(config.problem, { status: 503 });
  const origin = request.headers.get("origin") || "";
  if (!config.origins.includes(origin)) return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded"))
    return new Response(null, { status: 415 });
  const raw = await boundedBody(request);
  if (raw === null) return new Response(null, { status: 413 });
  const form = new URLSearchParams(new TextDecoder().decode(raw));
  const field = (name: string) => String(form.get(name) || "").trim();

  const redirect = (message: string, cookies: string[] = []) => {
    const url = new URL("/admin", origin);
    if (message) url.searchParams.set("message", message);
    const response = NextResponse.redirect(url, 303);
    response.headers.set("Cache-Control", "no-store");
    for (const cookie of cookies) response.headers.append("Set-Cookie", cookie);
    return response;
  };
  // Through the real handler, not auth.api, so Better Auth's rate limits apply.
  const auth = (path: string, body: Record<string, unknown>) => {
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/json");
    return handleAuthRequest(
      new Request(new URL(`/api/auth/${path}`, origin), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
      origin,
    );
  };

  if (action === "login") {
    const email = field("email").toLowerCase();
    const password = String(form.get("password") || "");
    // Only someone who knows ADMIN_EMAIL and ADMIN_PASSWORD can trigger the bootstrap.
    if (isBootstrapLogin(email, password)) await ensureAdmin();
    // Every attempt, admin or not, goes through Better Auth's rate-limited sign-in, so
    // neither the result nor the rate limit reveals which emails are admins.
    const started = new Date();
    const result = await auth("sign-in/email", { email, password, rememberMe: false });
    if (result.status === 429) return redirect("tooMany");
    if (!result.ok) return redirect("failed");
    const user = await getDatabase().user.findUnique({
      where: { email },
      select: { id: true, isAdmin: true },
    });
    if (!user?.isAdmin) {
      // Signed in but not an admin: end the session this sign-in created, fail the same way.
      if (user)
        await getDatabase().session.deleteMany({
          where: { userId: user.id, createdAt: { gte: started } },
        });
      return redirect("failed");
    }
    return redirect("", result.headers.getSetCookie());
  }

  // Everyone but a signed-in admin gets 404, so the admin area doesn't reveal itself.
  if (!(await currentAdmin(origin, request.headers))) return new Response(null, { status: 404 });
  if (action === "logout")
    return redirect("signedOut", (await auth("sign-out", {})).headers.getSetCookie());

  const settings = {
    controllerName: field("controllerName"),
    contactEmail: field("contactEmail"),
    smtpHost: field("smtpHost"),
    smtpPort: field("smtpPort"),
    smtpSecure: form.get("smtpSecure") === "on",
    smtpUser: field("smtpUser"),
    mailFrom: field("mailFrom"),
    allowRegistration: form.get("allowRegistration") === "on",
  };
  const port = Number(settings.smtpPort);
  if (
    (settings.contactEmail && !validEmail(settings.contactEmail)) ||
    (settings.mailFrom && !validEmail(settings.mailFrom)) ||
    (settings.smtpPort && !(Number.isInteger(port) && port > 0 && port <= 65535))
  )
    return redirect("invalid");
  const password = String(form.get("smtpPassword") || "");
  if (password && !encryptionReady()) return redirect("noEncryptionKey");
  const clear = form.get("clearSmtpPassword") === "on";
  // Registration can be switched on only together with working mail and real
  // (not placeholder) privacy details, judged on the values being saved.
  if (settings.allowRegistration) {
    const stored = clear ? "" : password || (await loadAccountSettings()).smtpPassword;
    if (!accountConfig({ ...settings, smtpPassword: stored }).registrationPossible)
      return redirect("registrationBlocked");
  }
  await saveSettings({ ...settings, smtpPassword: clear ? null : password || undefined });
  return redirect("saved");
}
