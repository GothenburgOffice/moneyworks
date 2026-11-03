import "server-only";
import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDatabase } from "./db";
import { accountConfig, authCookieOptions } from "./auth-config";
import { queueAccountEmail } from "./auth-mail";
import { loadAccountConfig, loadAccountSettings } from "./site-settings";
import { prepareGoogleLink, usesGoogleOnly } from "./sign-in-methods";

type GoogleClient = { clientId: string; clientSecret: string } | null;
const locale = (request?: Request) => request?.headers.get("x-moneyworks-locale") || "en";
const signInPage = (baseURL: string, request?: Request) =>
  `${baseURL}/${locale(request) === "sv" ? "sv" : "en"}/account?view=login`;
const googleOn = async () => Boolean((await loadAccountConfig()).google);

// The instance needs the origin and secret, so members (and the first admin) can sign
// in before mail is set up, plus Google's OAuth client when one is saved at /admin. Mail, privacy and
// registration change at runtime: the routes check them (loadAccountConfig) before
// registration, mail reads them when sending, and the hooks below when Google signs in.
function createAuth(secure: boolean, google: GoogleClient) {
  const config = accountConfig();
  if (!config.ready) throw new Error(config.problem);
  return betterAuth({
    appName: "MoneyWorks",
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: config.origins,
    database: prismaAdapter(getDatabase(), { provider: "postgresql" }),
    telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true,
      // Registration is a site setting that changes at runtime, so the only routes that
      // reach sign-up (api/auth and api/account) check registrationEnabled themselves.
      disableSignUp: false,
      minPasswordLength: 15,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        // A Google member has no password to reset while Google is on: tell them so.
        const google = (await usesGoogleOnly(user.id)) && (await googleOn());
        queueAccountEmail(
          user.email,
          google ? signInPage(config.baseURL, request) : url,
          google ? "google" : "reset",
          locale(request),
        );
      },
      // Registering an address that already has an account changes nothing and answers
      // like a new registration (no account enumeration); the mailbox owner is told how
      // to sign in instead.
      onExistingUserSignUp: async ({ user }, request) => {
        const google = (await usesGoogleOnly(user.id)) && (await googleOn());
        queueAccountEmail(
          user.email,
          signInPage(config.baseURL, request),
          google ? "google" : "existing",
          locale(request),
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 86400,
      sendVerificationEmail: async ({ user, url }, request) => {
        queueAccountEmail(user.email, url, "verify", locale(request));
      },
    },
    socialProviders: google
      ? {
          google: {
            clientId: google.clientId,
            clientSecret: google.clientSecret,
            prompt: "select_account",
            // Store only the address and Google's account id, not the name or photo.
            mapProfileToUser: () => ({ name: "MoneyWorks member", image: undefined }),
          },
        }
      : {},
    account: {
      encryptOAuthTokens: true,
      // Google's tokens are not needed after sign-in (the ID token also holds the name
      // and photo), so none are stored: see the account hook, and no refresh on sign-in.
      updateAccountOnSignIn: false,
      // One user per email address. Google proves the address, so signing in with
      // Google joins the existing user with that address; an unverified Google address
      // is never linked (no trusted providers) or registered (hook below).
      accountLinking: {
        enabled: true,
        disableImplicitLinking: false,
        // An unverified local account is linked too: prepareGoogleLink first removes
        // its password and sessions, since nobody proved owning the address before.
        requireLocalEmailVerified: false,
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
        trustedProviders: [],
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            if (!context?.path?.startsWith("/callback/")) return;
            if (!user.emailVerified)
              throw new APIError("FORBIDDEN", {
                code: "email_not_verified",
                message: "The provider has not verified this email address.",
              });
            // New Google members, like password ones, need registration open at /admin.
            if (!(await loadAccountConfig(true)).registrationEnabled)
              throw new APIError("FORBIDDEN", {
                code: "signup_disabled",
                message: "Registration is not available.",
              });
          },
        },
      },
      account: {
        create: {
          before: async (account) => {
            if (account.providerId === "google") {
              await prepareGoogleLink(account.userId);
              return {
                data: {
                  ...account,
                  accessToken: null,
                  refreshToken: null,
                  idToken: null,
                  accessTokenExpiresAt: null,
                  refreshTokenExpiresAt: null,
                  scope: null,
                },
              };
            }
            // Recovery would otherwise give a Google member a password again.
            else if (
              account.providerId === "credential" &&
              (await usesGoogleOnly(account.userId)) &&
              (await googleOn())
            )
              throw new APIError("FORBIDDEN", {
                code: "use_google",
                message: "This account signs in with Google.",
              });
          },
        },
      },
    },
    session: { expiresIn: 86400, updateAge: 3600, freshAge: 600, cookieCache: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-in/social": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      // Set the prefix ourselves: Better Auth's automatic __Secure- would be put
      // in front of __Host- and make the name invalid. Secure stays mandatory on HTTPS.
      ...authCookieOptions({ secure }),
      ipAddress: { ipAddressHeaders: ["x-moneyworks-client-ip"] },
    },
  });
}

// One instance per cookie mode (HTTPS origins get __Host- Secure cookies, HTTP
// loopback aliases the development names) and Google client: saving another client
// at /admin builds a new instance. Pass the request's allowed origin.
const instances = new Map<boolean, { key: string; auth: ReturnType<typeof createAuth> }>();
export async function getAuth(origin: string) {
  const secure = origin.startsWith("https:");
  const settings = await loadAccountSettings().catch(() => ({}));
  const google = accountConfig(settings).google;
  const key = google
    ? createHash("sha256").update(`${google.clientId}\n${google.clientSecret}`).digest("hex")
    : "";
  let instance = instances.get(secure);
  if (!instance || instance.key !== key) {
    instance = { key, auth: createAuth(secure, google) };
    instances.set(secure, instance);
  }
  return instance.auth;
}
