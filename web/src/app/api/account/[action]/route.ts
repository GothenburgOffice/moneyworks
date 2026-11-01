import { NextResponse } from "next/server";
import { boundedBody, handleAuthRequest } from "@/lib/auth-http";
import { accountConfig } from "@/lib/auth-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const operations: Record<string, string> = {
  login: "sign-in/email",
  register: "sign-up/email",
  logout: "sign-out",
  forgot: "request-password-reset",
  reset: "reset-password",
  resend: "send-verification-email",
};
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const config = accountConfig();
  const { action } = await params;
  if (!operations[action]) return new Response(null, { status: 404 });
  if (!config.configured) return new Response(config.problem, { status: 503 });
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
  if (action === "login") body = { email, password, rememberMe: false };
  if (action === "register") {
    if (!config.registrationEnabled) return redirect("register", "unavailable");
    if (password !== form.get("confirmPassword")) return redirect("register", "passwordMismatch");
    body = { name: "MoneyWorks member", email, password, callbackURL };
  }
  if (action === "forgot") body = { email, redirectTo: `${page.href}?view=reset` };
  if (action === "resend") body = { email, callbackURL };
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
  const view = action === "register" ? "register" : action === "forgot" ? "forgot" : "login";
  const message =
    result.status === 429
      ? "tooMany"
      : !result.ok
        ? "failed"
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
