import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDatabase } from "./db";
import { accountConfig, authCookieOptions } from "./auth-config";
import { queueAccountEmail } from "./auth-mail";

// The instance needs only the origin and secret, so the admin can sign in before
// mail is set up. Mail and privacy settings change at runtime: the routes check
// them (loadAccountConfig) before registration, and mail reads them when sending.
function createAuth(secure: boolean) {
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
        queueAccountEmail(
          user.email,
          url,
          "reset",
          request?.headers.get("x-moneyworks-locale") || "en",
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 86400,
      sendVerificationEmail: async ({ user, url }, request) => {
        queueAccountEmail(
          user.email,
          url,
          "verify",
          request?.headers.get("x-moneyworks-locale") || "en",
        );
      },
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
        trustedProviders: [],
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

// One instance per cookie mode: HTTPS origins get __Host- Secure cookies, HTTP
// loopback aliases the development names. Pass the request's allowed origin.
const instances = new Map<boolean, ReturnType<typeof createAuth>>();
export function getAuth(origin: string) {
  const secure = origin.startsWith("https:");
  let instance = instances.get(secure);
  if (!instance) {
    instance = createAuth(secure);
    instances.set(secure, instance);
  }
  return instance;
}
