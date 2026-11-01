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
] as const;
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
  return {
    view:
      typeof query.view === "string" && allowedViews.includes(query.view)
        ? (query.view as AccountView)
        : "login",
    message:
      typeof query.message === "string" && allowedMessages.includes(query.message)
        ? (query.message as AccountMessage)
        : undefined,
    token: typeof query.token === "string" && query.token.length <= 2048 ? query.token : "",
    hasError: Boolean(query.error),
  };
}
