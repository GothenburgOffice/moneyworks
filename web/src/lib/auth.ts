import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { getDatabase } from './db';
import { accountConfig, authCookieOptions } from './auth-config';
import { queueAccountEmail } from './auth-mail';

function createAuth() {
  const config = accountConfig();
  if (!config.configured) throw new Error('Account service is not configured.');
  return betterAuth({
    appName: 'MoneyWorks',
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: [config.baseURL],
    database: prismaAdapter(getDatabase(), { provider: 'postgresql' }),
    telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !config.registrationEnabled,
      minPasswordLength: 15,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        queueAccountEmail(user.email, url, 'reset', request?.headers.get('x-moneyworks-locale') || 'en');
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 86400,
      sendVerificationEmail: async ({ user, url }, request) => {
        queueAccountEmail(user.email, url, 'verify', request?.headers.get('x-moneyworks-locale') || 'en');
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
      enabled: true, storage: 'database', window: 60, max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/request-password-reset': { window: 60, max: 3 },
        '/send-verification-email': { window: 60, max: 3 },
        '/reset-password': { window: 60, max: 5 },
      },
    },
    advanced: {
      // Set the prefix ourselves: Better Auth's automatic __Secure- would be put
      // in front of __Host- and make the name invalid. Secure stays mandatory on HTTPS.
      ...authCookieOptions(config),
      ipAddress: { ipAddressHeaders: ['x-moneyworks-client-ip'] },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  instance ??= createAuth();
  return instance;
}
