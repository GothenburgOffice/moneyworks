// Type-only import: Node runs this module directly in the unit tests.
import type { FirePlan, Pension } from "./model";

/** The FIRE form as kept in the browser tab between reloads and in-site navigation.
 * Values are the form's own strings, so a restored form looks exactly as it was left.
 * Only accepted payouts are kept; open payout edits are drafts and are not.
 */
export type StoredFireInputs = {
  goal: FirePlan["goal"];
  strategy: FirePlan["strategy"];
  values: Record<string, string>;
  pensions: Pension[];
};

// Bump when the stored shape changes; older data is then ignored, never migrated.
export const FIRE_STORAGE_KEY = "moneyworks.fire.v1";
const MAX_FIELD_LENGTH = 40;

export function serializeFireInputs(inputs: StoredFireInputs): string {
  return JSON.stringify(inputs);
}

/** Returns the stored inputs, or null when they are missing, malformed or from another
 * version. `fields` lists the form's current field names and their defaults: unknown
 * names are dropped and missing ones fall back to the default. Payouts are checked with
 * the model's own validator (`isValidPension`).
 */
export function parseFireInputs(
  raw: string | null,
  fields: Record<string, string>,
  isValidPension: (pension: Pension) => boolean,
): StoredFireInputs | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const { goal, strategy, values, pensions } = data as Record<string, unknown>;
  if (goal !== "portfolio" && goal !== "age") return null;
  if (strategy !== "drawdown" && strategy !== "preserve") return null;
  if (!values || typeof values !== "object" || !Array.isArray(pensions)) return null;

  const restored: Record<string, string> = {};
  for (const [field, fallback] of Object.entries(fields)) {
    const value = (values as Record<string, unknown>)[field];
    if (value === undefined) restored[field] = fallback;
    else if (typeof value === "string" && value.length <= MAX_FIELD_LENGTH) restored[field] = value;
    else return null;
  }
  if (!pensions.every((pension) => isValidPension(pension as Pension))) return null;

  return { goal, strategy, values: restored, pensions: pensions as Pension[] };
}

/** True when the form is untouched, so there is nothing worth keeping. */
export function isDefaultFireInputs(
  inputs: StoredFireInputs,
  fields: Record<string, string>,
): boolean {
  return (
    inputs.goal === "portfolio" &&
    inputs.strategy === "drawdown" &&
    inputs.pensions.length === 0 &&
    Object.entries(fields).every(([field, value]) => inputs.values[field] === value)
  );
}
