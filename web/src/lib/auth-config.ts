// Configuration is lazy: public SSG never needs auth secrets, SMTP or a database.
export function accountConfig() {
  const rawURL = process.env.AUTH_BASE_URL || '';
  let baseURL = '';
  let secure = false;
  try {
    const url = new URL(rawURL);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) &&
        !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) {
      baseURL = url.origin;
      secure = url.protocol === 'https:';
    }
  } catch { /* Not configured; fail closed rather than guess a host. */ }
  const secret = process.env.AUTH_SECRET || '';
  const mailHost = process.env.SMTP_HOST || '';
  const localMail = ['localhost', '127.0.0.1', '::1'].includes(mailHost);
  const plainLocalMail = localMail && process.env.SMTP_ALLOW_LOCAL_PLAINTEXT === 'true';
  const mailFrom = process.env.MAIL_FROM || '';
  const mailPort = Number(process.env.SMTP_PORT || 587);
  const controller = process.env.PRIVACY_CONTROLLER_NAME || '';
  const contact = process.env.PRIVACY_CONTACT_EMAIL || '';
  const configured = Boolean(baseURL && secret.length >= 32 && !secret.startsWith('replace-') &&
    mailHost && Number.isInteger(mailPort) && mailPort > 0 && mailPort <= 65535 &&
    Boolean(process.env.SMTP_USER) === Boolean(process.env.SMTP_PASSWORD) &&
    /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(mailFrom));
  const privacyReady = Boolean(controller.trim() && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(contact));
  return {
    baseURL, secure, secret, configured, privacyReady, controller, contact,
    registrationEnabled: configured && privacyReady && process.env.AUTH_PUBLIC_SIGNUP === 'true',
    cookiePrefix: secure ? '__Host-moneyworks' : 'moneyworks-dev',
    mailHost, mailFrom, mailPort, plainLocalMail,
  };
}

export function authCookieOptions(config: Pick<ReturnType<typeof accountConfig>, 'secure' | 'cookiePrefix'>) {
  return {
    useSecureCookies: false,
    cookiePrefix: config.cookiePrefix,
    defaultCookieAttributes: { secure: config.secure, httpOnly: true, sameSite: 'lax' as const, path: '/' },
  };
}
