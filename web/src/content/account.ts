import type { Locale } from "./site";
const en = {
  account: "Account",
  login: "Log in",
  register: "Create an account",
  logout: "Log out",
  loginTitle: "Welcome back.",
  registerTitle: "Make room for your plans.",
  loginIntro: "Sign in to your MoneyWorks account.",
  registerIntro:
    "Create your account with email and password. Verify your email before signing in.",
  email: "Email address",
  password: "Password",
  confirmPassword: "Confirm password",
  passwordHint:
    "Use 15–128 characters. A long, unique passphrase works well. Password managers and paste are welcome.",
  forgot: "Forgot your password?",
  forgotTitle: "A fresh start.",
  forgotIntro: "If the account is eligible, we will send a recovery link.",
  sendReset: "Send recovery link",
  resetTitle: "Choose a new password.",
  reset: "Save new password",
  resend: "Resend verification email",
  resendTitle: "Check your inbox.",
  sendVerification: "Send verification link",
  back: "Back to MoneyWorks",
  unavailable:
    "Accounts are not ready on this host. The operator must configure the account URL, secret, email delivery and privacy contact. Please do not submit personal information yet.",
  futureTitle: "A place for the next chapter.",
  futureBody:
    "Your account is ready. Portfolio saving and tax workspaces will be added later; there are no saved financial records to show yet.",
  signedIn: "Signed in as",
  verified: "Email verified",
  methods: "Sign-in methods",
  emailMethod: "Email and password",
  googleMethod: "Google",
  siteSettings: "Site settings (admin)",
  or: "or",
  continueGoogle: "Continue with Google",
  addGoogle: "Sign in with Google instead",
  addGoogleHint:
    "Use the Google account with this same email address. Your password is then removed, and you sign in with Google from then on.",
  googleSecurity:
    "You sign in with Google, so there is no password here. Your Google account's security settings protect this account too.",
  googleSignupClosed:
    "No account uses this Google address yet, and new accounts cannot be created right now.",
  googleUnverified:
    "Google has not verified this email address, so it cannot be used to sign in here.",
  security: "Account security",
  securityBody:
    "Use a unique password. Log out on shared devices. Password resets revoke existing sessions.",
  failed:
    "We could not complete that request. Check your details, or request a fresh verification or recovery link.",
  passwordMismatch: "The passwords do not match. Please enter them again.",
  verificationSent:
    "If the address is eligible, a verification link will arrive. Check your inbox, then return to log in.",
  resetSent:
    "If the account is eligible, a recovery link will arrive. This message does not confirm whether an account exists.",
  passwordChanged: "Your password has been changed. Sign in again with the new password.",
  tooMany: "Too many requests. Please wait at least a minute before trying again.",
  resetMissing: "Open a valid recovery link from your email, or request a new one.",
};
export type AccountCopy = { [K in keyof typeof en]: string };
const sv: AccountCopy = {
  account: "Konto",
  login: "Logga in",
  register: "Skapa konto",
  logout: "Logga ut",
  loginTitle: "Välkommen tillbaka.",
  registerTitle: "Gör plats för dina planer.",
  loginIntro: "Logga in på ditt konto hos Pengar jobbar.",
  registerIntro:
    "Skapa konto med e-post och lösenord. Bekräfta din e-postadress innan du loggar in.",
  email: "E-postadress",
  password: "Lösenord",
  confirmPassword: "Bekräfta lösenord",
  passwordHint:
    "Använd 15–128 tecken. En lång, unik lösenfras fungerar bra. Lösenordshanterare och inklistring är tillåtna.",
  forgot: "Glömt lösenordet?",
  forgotTitle: "En ny start.",
  forgotIntro: "Om kontot är berättigat skickar vi en återställningslänk.",
  sendReset: "Skicka återställningslänk",
  resetTitle: "Välj ett nytt lösenord.",
  reset: "Spara nytt lösenord",
  resend: "Skicka bekräftelsemejl igen",
  resendTitle: "Titta i din inkorg.",
  sendVerification: "Skicka bekräftelselänk",
  back: "Tillbaka till Pengar jobbar",
  unavailable:
    "Konton är inte redo på denna värd. Operatören behöver konfigurera kontoadress, hemlighet, mejlleverans och integritetskontakt. Lämna inte personuppgifter ännu.",
  futureTitle: "Plats för nästa kapitel.",
  futureBody:
    "Ditt konto är klart. Sparade portföljer och skatteberäkningar läggs till senare; det finns ännu inga sparade ekonomiska uppgifter att visa.",
  signedIn: "Inloggad som",
  verified: "E-post bekräftad",
  methods: "Inloggningsmetoder",
  emailMethod: "E-post och lösenord",
  googleMethod: "Google",
  siteSettings: "Webbplatsinställningar (admin)",
  or: "eller",
  continueGoogle: "Fortsätt med Google",
  addGoogle: "Logga in med Google i stället",
  addGoogleHint:
    "Använd Google-kontot med samma e-postadress. Lösenordet tas då bort och du loggar in med Google från och med nu.",
  googleSecurity:
    "Du loggar in med Google, så det finns inget lösenord här. Säkerhetsinställningarna i ditt Google-konto skyddar även detta konto.",
  googleSignupClosed:
    "Inget konto använder den här Google-adressen ännu, och nya konton kan inte skapas just nu.",
  googleUnverified:
    "Google har inte bekräftat den här e-postadressen, så den kan inte användas för att logga in här.",
  security: "Kontosäkerhet",
  securityBody:
    "Använd ett unikt lösenord. Logga ut på delade enheter. Återställning av lösenord återkallar befintliga sessioner.",
  failed:
    "Begäran kunde inte slutföras. Kontrollera uppgifterna eller begär en ny bekräftelse- eller återställningslänk.",
  passwordMismatch: "Lösenorden stämmer inte överens. Ange dem igen.",
  verificationSent:
    "Om adressen är berättigad kommer en bekräftelselänk. Kontrollera inkorgen och återvänd sedan för att logga in.",
  resetSent:
    "Om kontot är berättigat kommer en återställningslänk. Meddelandet bekräftar inte om kontot finns.",
  passwordChanged: "Ditt lösenord har ändrats. Logga in igen med det nya lösenordet.",
  tooMany: "För många försök. Vänta minst en minut och försök igen.",
  resetMissing: "Öppna en giltig återställningslänk från ditt mejl eller begär en ny.",
};
export function getAccountCopy(locale: Locale): AccountCopy {
  return locale === "sv" ? sv : en;
}
