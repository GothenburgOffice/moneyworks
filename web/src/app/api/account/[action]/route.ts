import { NextResponse } from "next/server";
import { ensureAdmin, isBootstrapLogin } from "@/lib/admin";
import { boundedBody, handleAuthRequest } from "@/lib/auth-http";
import { getAuth } from "@/lib/auth";
import { usesGoogleOnly } from "@/lib/sign-in-methods";
import { loadAccountConfig } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const operations: Record<string, string> = {
  login: "sign-in/email",
  register: "sign-up/email",
  logout: "sign-out",
  forgot: "request-password-reset",
  reset: "reset-password",
  resend: "send-verification-email",
  google: "sign-in/social",
  delete: "delete-user",
};
// Better Auth error codes that have their own message on the account page.
const errorMessages: Record<string, string> = {
  account_locked: "locked",
  INVALID_PASSWORD: "deleteWrongPassword",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "deleteWrongPassword",
  // delete-user throws SESSION_EXPIRED for a session older than freshAge; Better Auth's
  // other sensitive routes use SESSION_NOT_FRESH, kept in case delete-user moves to it.
  SESSION_EXPIRED: "deleteSignInAgain",
  SESSION_NOT_FRESH: "deleteSignInAgain",
  last_admin: "deleteLastAdmin",
};
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!operations[action]) return new Response(null, { status: 404 });
  // Registrations read the settings fresh, so a registration switch-off applies at once.
  const config = await loadAccountConfig(action === "register");
  // Signing in and out needs only the origin and secret: the first admin must get in
  // to set up mail at /admin. Everything else sends mail or creates accounts.
  // Deleting your own account needs no mail either.
  const ready = ["login", "logout", "delete"].includes(action) ? config.ready : config.configured;
  if (!ready) return new Response(config.problem, { status: 503 });
  // Fail closed: only exact allowed origins; no null/absent origins, wildcards,
  // forwarded-host guesses or GET mutations.
  const origin = request.headers.get("origin") || "";
  if (!config.origins.includes(origin)) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 8192)
    return new Response(null, { status: 413 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded"))
    return new Response(null, { status: 415 });
  const raw = await boundedBody(request);
  if (raw === null) return new Response(null, { status: 413 });
  const form = new URLSearchParams(new TextDecoder().decode(raw));
  const locale = form.get("locale") === "sv" ? "sv" : "en";
  // Stay on the origin the form was posted from (APP_ORIGIN or an alias).
  const page = new URL(`/${locale}/account`, origin);
  const redirect = (view: string, message: string, recoveryToken = "") => {
    const url = new URL(page);
    url.searchParams.set("view", view);
    url.searchParams.set("message", message);
    if (view === "reset" && recoveryToken)
      url.searchParams.set("token", recoveryToken.slice(0, 2048));
    const result = NextResponse.redirect(url, 303);
    result.headers.set("Cache-Control", "no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const callbackURL = page.href;
  let body: Record<string, unknown> = {};
  if (action === "login") {
    body = { email, password, rememberMe: false };
    // While no admin exists, signing in with ADMIN_EMAIL and ADMIN_PASSWORD creates
    // (or takes over) that account first. Only someone who knows both can trigger it.
    if (isBootstrapLogin(email.toLowerCase(), password)) await ensureAdmin();
  }
  if (action === "register") {
    if (!config.registrationEnabled) return redirect("register", "unavailable");
    if (password !== form.get("confirmPassword")) return redirect("register", "passwordMismatch");
    body = { name: "MoneyWorks member", email, password, callbackURL };
  }
  if (action === "forgot") body = { email, redirectTo: `${page.href}?view=reset` };
  if (action === "resend") body = { email, callbackURL };
  if (action === "google") {
    // Google returns to APP_ORIGIN (the redirect URI registered with Google), so the
    // flow must start there too: its state cookie is set on this origin.
    if (!config.google || origin !== config.baseURL) return redirect("login", "unavailable");
    const back = `${page.href}?view=login`;
    body = {
      provider: "google",
      callbackURL: back,
      newUserCallbackURL: back,
      errorCallbackURL: back,
      disableRedirect: true,
    };
  }
  if (action === "delete") {
    if (form.get("confirm") !== "on") return redirect("login", "deleteConfirm");
    const session = await (await getAuth(origin)).api.getSession({ headers: request.headers });
    if (!session) return redirect("login", "");
    // A password member always confirms with the password: without one, Better Auth
    // accepts any recent session. Google members need a recent Google sign-in instead.
    if (!(await usesGoogleOnly(session.user.id)) && !password)
      return redirect("login", "deleteWrongPassword");
    body = password ? { password } : {};
  }
  if (action === "reset") {
    if (password !== form.get("confirmPassword"))
      return redirect("reset", "passwordMismatch", String(form.get("token") || ""));
    body = { newPassword: password, token: String(form.get("token") || "") };
  }
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json");
  headers.set("x-moneyworks-locale", locale);
  // Use the actual handler, not auth.api: server API calls bypass rate limits.
  const result = await handleAuthRequest(
    new Request(new URL(`/api/auth/${operations[action]}`, origin), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
    origin,
  );
  if (action === "google") {
    const target = result.ok ? ((await result.json()) as { url?: string }).url : "";
    // Only ever hand the browser on to Google's own sign-in page.
    if (!target || new URL(target).origin !== "https://accounts.google.com")
      return redirect("login", result.status === 429 ? "tooMany" : "failed");
    const response = NextResponse.redirect(target, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    for (const cookie of result.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    return response;
  }
  const view = action === "register" ? "register" : action === "forgot" ? "forgot" : "login";
  const code =
    !result.ok && result.status !== 429
      ? String(((await result.json().catch(() => ({}))) as { code?: unknown }).code || "")
      : "";
  const message =
    result.status === 429
      ? "tooMany"
      : !result.ok
        ? Object.hasOwn(errorMessages, code)
          ? errorMessages[code]
          : "failed"
        : action === "delete"
          ? "deleted"
          : action === "register" || action === "resend"
            ? "verificationSent"
            : action === "forgot"
              ? "resetSent"
              : action === "reset"
                ? "passwordChanged"
                : "";
  const response = redirect(view, message);
  for (const cookie of result.headers.getSetCookie()) response.headers.append("Set-Cookie", cookie);
  return response;
}
