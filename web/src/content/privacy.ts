import type { Locale } from "./site";

// Shared public privacy information; independent of account rendering and auth.
// This remains draft information until the operator completes the launch review.
const en = {
  privacy: "Cookies & privacy",
  privacyTitle: "Your account. Your information.",
  cookieShort: "Sign-in cookies and settings kept in your browser. No analytics or advertising.",
  cookieDetail:
    "Money Working does not set analytics, advertising or tracking cookies. Sign-in uses necessary authentication and security cookies. If you pick a light or dark theme, your browser remembers the choice in local storage; it is never sent to us. There is no “accept all” step and browsing does not require an account.",
  cookieLifetime:
    "Sign-in cookies are browser-session cookies by default. A server session expires after 24 hours unless renewed through activity. Logging out revokes the session. Secure deployments use __Host-moneyworks.session_token and __Host-moneyworks.dont_remember; loopback development uses moneyworks-dev equivalents.",
  privacyLead:
    "An account stores your email, verification state, a password hash or a Google account ID, sign-in identities, the time of your last sign-in, whether an admin has locked the account, and session/security records including IP and browser information. Passwords are not stored as readable text.",
  privacyPurpose:
    "The account service uses this information for sign-in, security, verification and recovery messages through the configured mail service. Portfolios and tax workspaces are not implemented yet. These forms do not collect financial records.",
  privacyGoogle:
    "If you sign in with Google, Google learns that you are signing in to this site, and we receive your email address, whether Google has verified it, and your Google account ID. We keep only the address and that ID, not your name, profile photo or Google's sign-in tokens. Your account then signs in with Google instead of a password. Google's own privacy policy covers what Google does with the sign-in.",
  privacyRetention:
    "Account data remains until you delete the account on the account page, which removes it and everything saved in it at once. An admin can lock an account or move it to the trash; an account in the trash cannot sign in and is deleted with its data after 30 days. Sessions expire; expired session, verification and rate-limit records need the cleanup task. Before public launch, the operator must define backup and retention procedures.",
  privacyRights:
    "You can download your account data and delete your account yourself on the account page. You can also ask the operator for access, correction, export or deletion and complain to the relevant supervisory authority. Account access fulfils your requested account service; security measures protect that service. No marketing consent is bundled into registration.",
  controller: "Data controller",
  contact: "Privacy contact",
  privacyMissing:
    "Real operator identity and contact details are not configured. Public registration stays disabled until these details and email delivery are ready.",
  privacyAgreement:
    "By creating an account, you request the account service. Read how account information is handled; this is not consent to tracking or marketing.",
};
export type PrivacyCopy = { [K in keyof typeof en]: string };
const sv: PrivacyCopy = {
  privacy: "Kakor och integritet",
  privacyTitle: "Ditt konto. Dina uppgifter.",
  cookieShort:
    "Inloggningskakor och inställningar som sparas i din webbläsare. Ingen analys eller reklam.",
  cookieDetail:
    "Pengar jobbar använder inte analys-, reklam- eller spårningskakor. Inloggning använder nödvändiga autentiserings- och säkerhetskakor. Om du väljer ljust eller mörkt tema sparar webbläsaren valet i sin lokala lagring; det skickas aldrig till oss. Det finns inget ”godkänn alla”-steg och du behöver inget konto för att läsa sidan.",
  cookieLifetime:
    "Inloggningskakor är normalt sessionskakor. Serverns session löper ut efter 24 timmar om den inte förnyas vid aktivitet. Utloggning återkallar sessionen. Säkra installationer använder __Host-moneyworks.session_token och __Host-moneyworks.dont_remember; lokal utveckling använder motsvarigheter med moneyworks-dev.",
  privacyLead:
    "Kontot lagrar e-postadress, bekräftelsestatus, lösenordshash eller Google-konto-id, inloggningsidentiteter, tidpunkten för senaste inloggning, om en administratör har spärrat kontot samt sessions- och säkerhetsuppgifter som IP-adress och webbläsarinformation. Lösenord lagras inte i läsbar klartext.",
  privacyPurpose:
    "Uppgifterna används för kontoåtkomst, säkerhet och bekräftelse- och återställningsmejl via den konfigurerade mejltjänsten. Portföljer och skattearbetsytor är inte implementerade. Dessa formulär samlar inte in ekonomiska underlag.",
  privacyGoogle:
    "Om du loggar in med Google får Google veta att du loggar in på den här webbplatsen, och vi får din e-postadress, uppgift om huruvida Google har bekräftat den och ditt Google-konto-id. Vi sparar bara adressen och id:t, inte ditt namn, din profilbild eller Googles inloggningstoken. Kontot loggar sedan in med Google i stället för med lösenord. Googles egen integritetspolicy gäller för vad Google gör med inloggningen.",
  privacyRetention:
    "Kontouppgifter finns kvar tills du raderar kontot på kontosidan, vilket tar bort det och allt som sparats i det direkt. En administratör kan spärra ett konto eller flytta det till papperskorgen; ett konto i papperskorgen kan inte logga in och raderas med sina uppgifter efter 30 dagar. Sessioner löper ut; utgångna sessions-, bekräftelse- och begränsningsposter behöver rensas av rensningsuppgiften. Före publik lansering måste operatören fastställa rutiner för säkerhetskopiering och lagring.",
  privacyRights:
    "Du kan själv ladda ner dina kontouppgifter och radera kontot på kontosidan. Du kan också begära tillgång, rättelse, export eller radering hos operatören och klaga hos relevant tillsynsmyndighet. Kontot tillhandahåller tjänsten du begär; säkerhetsåtgärder skyddar den. Registrering innebär inte samtycke till marknadsföring.",
  controller: "Personuppgiftsansvarig",
  contact: "Integritetskontakt",
  privacyMissing:
    "Operatörens riktiga identitet och kontaktuppgifter är inte konfigurerade. Publik registrering är avstängd tills detta och mejlleverans är klart.",
  privacyAgreement:
    "Genom att skapa konto begär du kontotjänsten. Läs hur kontouppgifter hanteras; detta är inte samtycke till spårning eller marknadsföring.",
};

export function getPrivacyCopy(locale: Locale): PrivacyCopy {
  return locale === "sv" ? sv : en;
}
