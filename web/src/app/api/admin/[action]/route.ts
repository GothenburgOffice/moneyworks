import { NextResponse } from "next/server";
import { boundedBody } from "@/lib/auth-http";
import { accountConfig, validEmail } from "@/lib/auth-config";
import { currentAdmin } from "@/lib/admin";
import { encryptionReady } from "@/lib/secrets";
import { loadAccountSettings, saveSettings } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The settings form at /admin. Same origin, size and type checks as the account forms;
// admins sign in and out through the account forms.
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== "settings") return new Response(null, { status: 404 });
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

  const redirect = (message: string) => {
    const url = new URL("/admin", origin);
    if (message) url.searchParams.set("message", message);
    const response = NextResponse.redirect(url, 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  // Everyone but a signed-in admin gets 404, so the admin area doesn't reveal itself.
  if (!(await currentAdmin(origin, request.headers))) return new Response(null, { status: 404 });

  const settings = {
    controllerName: field("controllerName"),
    contactEmail: field("contactEmail"),
    smtpHost: field("smtpHost"),
    smtpPort: field("smtpPort"),
    smtpSecure: form.get("smtpSecure") === "on",
    smtpUser: field("smtpUser"),
    mailFrom: field("mailFrom"),
    allowRegistration: form.get("allowRegistration") === "on",
    googleClientId: field("googleClientId"),
  };
  const port = Number(settings.smtpPort);
  if (
    (settings.contactEmail && !validEmail(settings.contactEmail)) ||
    (settings.mailFrom && !validEmail(settings.mailFrom)) ||
    (settings.smtpPort && !(Number.isInteger(port) && port > 0 && port <= 65535)) ||
    (settings.googleClientId &&
      !/^[\w.-]{1,200}\.apps\.googleusercontent\.com$/.test(settings.googleClientId))
  )
    return redirect("invalid");
  const password = String(form.get("smtpPassword") || "");
  const googleSecret = field("googleClientSecret");
  if ((password || googleSecret) && !encryptionReady()) return redirect("noEncryptionKey");
  const clear = form.get("clearSmtpPassword") === "on";
  const clearGoogle = form.get("clearGoogleClientSecret") === "on";
  // Registration can be switched on only together with working mail and real
  // (not placeholder) privacy details, judged on the values being saved.
  if (settings.allowRegistration) {
    const stored = clear ? "" : password || (await loadAccountSettings()).smtpPassword;
    if (!accountConfig({ ...settings, smtpPassword: stored }).registrationPossible)
      return redirect("registrationBlocked");
  }
  await saveSettings({
    ...settings,
    smtpPassword: clear ? null : password || undefined,
    googleClientSecret: clearGoogle ? null : googleSecret || undefined,
  });
  return redirect("saved");
}
