import type { Locale } from './site';

// Shared public privacy information; independent of account rendering and auth.
// This remains draft information until the operator completes the launch review.
const en = {
  privacy: 'Cookies & privacy',
  privacyTitle: 'Your account. Your information.',
  cookieShort: 'Essential sign-in cookies only. No analytics or advertising.',
  cookieDetail: 'MoneyWorks does not set analytics, advertising or tracking cookies. Sign-in uses necessary authentication and security cookies. There is no “accept all” step and browsing does not require an account.',
  cookieLifetime: 'Sign-in cookies are browser-session cookies by default. A server session expires after 24 hours unless renewed through activity. Logging out revokes the session. Secure deployments use __Host-moneyworks.session_token and __Host-moneyworks.dont_remember; loopback development uses moneyworks-dev equivalents.',
  privacyLead: 'An account stores your email, verification state, a password hash, sign-in identities and session/security records including IP and browser information. Passwords are not stored as readable text.',
  privacyPurpose: 'The account service uses this information for sign-in, security, verification and recovery messages through the configured mail service. Portfolios and tax workspaces are not implemented yet. These forms do not collect financial records.',
  privacyRetention: 'Account data remains until deletion is requested. Sessions expire; expired session, verification and rate-limit records need the cleanup task. Before public launch, the operator must define backup and retention procedures.',
  privacyRights: 'You can ask the operator for access, correction, export or deletion and complain to the relevant supervisory authority. Account access fulfils your requested account service; security measures protect that service. No marketing consent is bundled into registration.',
  controller: 'Data controller',
  contact: 'Privacy contact',
  privacyMissing: 'Real operator identity and contact details are not configured. Public registration stays disabled until these details and email delivery are ready.',
  privacyAgreement: 'By creating an account, you request the account service. Read how account information is handled; this is not consent to tracking or marketing.',
};
export type PrivacyCopy = { [K in keyof typeof en]: string };
const sv: PrivacyCopy = {
  privacy: 'Kakor och integritet',
  privacyTitle: 'Ditt konto. Dina uppgifter.',
  cookieShort: 'Bara nödvändiga inloggningskakor. Ingen analys eller reklam.',
  cookieDetail: 'Pengar jobbar använder inte analys-, reklam- eller spårningskakor. Inloggning använder nödvändiga autentiserings- och säkerhetskakor. Det finns inget ”godkänn alla”-steg och du behöver inget konto för att läsa sidan.',
  cookieLifetime: 'Inloggningskakor är normalt sessionskakor. Serverns session löper ut efter 24 timmar om den inte förnyas vid aktivitet. Utloggning återkallar sessionen. Säkra installationer använder __Host-moneyworks.session_token och __Host-moneyworks.dont_remember; lokal utveckling använder motsvarigheter med moneyworks-dev.',
  privacyLead: 'Kontot lagrar e-postadress, bekräftelsestatus, lösenordshash, inloggningsidentiteter samt sessions- och säkerhetsuppgifter som IP-adress och webbläsarinformation. Lösenord lagras inte i läsbar klartext.',
  privacyPurpose: 'Uppgifterna används för kontoåtkomst, säkerhet och bekräftelse- och återställningsmejl via den konfigurerade mejltjänsten. Portföljer och skattearbetsytor är inte implementerade. Dessa formulär samlar inte in ekonomiska underlag.',
  privacyRetention: 'Kontouppgifter finns kvar tills radering begärs. Sessioner löper ut; utgångna sessions-, bekräftelse- och begränsningsposter behöver rensas av rensningsuppgiften. Före publik lansering måste operatören fastställa rutiner för säkerhetskopiering och lagring.',
  privacyRights: 'Du kan begära tillgång, rättelse, export eller radering hos operatören och klaga hos relevant tillsynsmyndighet. Kontot tillhandahåller tjänsten du begär; säkerhetsåtgärder skyddar den. Registrering innebär inte samtycke till marknadsföring.',
  controller: 'Personuppgiftsansvarig',
  contact: 'Integritetskontakt',
  privacyMissing: 'Operatörens riktiga identitet och kontaktuppgifter är inte konfigurerade. Publik registrering är avstängd tills detta och mejlleverans är klart.',
  privacyAgreement: 'Genom att skapa konto begär du kontotjänsten. Läs hur kontouppgifter hanteras; detta är inte samtycke till spårning eller marknadsföring.',
};

export function getPrivacyCopy(locale: Locale): PrivacyCopy {
  return locale === 'sv' ? sv : en;
}
