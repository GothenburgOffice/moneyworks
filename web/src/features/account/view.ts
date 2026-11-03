export const accountFormViews = ["login", "register", "forgot", "reset", "resend"] as const;
export type AccountFormView = (typeof accountFormViews)[number];
export type AccountView = AccountFormView | "privacy";

export const accountMessages = [
  "failed",
  "passwordMismatch",
  "verificationSent",
  "resetSent",
  "passwordChanged",
  "tooMany",
  "unavailable",
  "googleSignupClosed",
  "googleUnverified",
] as const;
// Error codes a sign-in provider's callback may return that have their own message.
const callbackErrors: Record<string, AccountMessage> = {
  signup_disabled: "googleSignupClosed",
  email_not_verified: "googleUnverified",
};
export type AccountMessage = (typeof accountMessages)[number];
type Query = Record<string, string | string[] | undefined>;

// Pure query parsing: no auth configuration, database access or rendering.
export function parseAccountQuery(query: Query): {
  view: AccountView;
  message?: AccountMessage;
  token: string;
  hasError: boolean;
} {
  const allowedViews: readonly string[] = [...accountFormViews, "privacy"];
  const allowedMessages: readonly string[] = accountMessages;
  const callbackError =
    typeof query.error === "string" && Object.hasOwn(callbackErrors, query.error)
      ? callbackErrors[query.error]
      : undefined;
  return {
    view:
      typeof query.view === "string" && allowedViews.includes(query.view)
        ? (query.view as AccountView)
        : "login",
    message:
      callbackError ??
      (typeof query.message === "string" && allowedMessages.includes(query.message)
        ? (query.message as AccountMessage)
        : undefined),
    token: typeof query.token === "string" && query.token.length <= 2048 ? query.token : "",
    hasError: Boolean(query.error) && !callbackError,
  };
}
