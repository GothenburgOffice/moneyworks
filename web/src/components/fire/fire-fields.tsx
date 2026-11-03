import type { FocusEvent } from "react";
import type { FireCopy } from "@/content/fire";

export const fireFieldDefaults = {
  currentAge: "35",
  retirementAge: "55",
  endAge: "95",
  endBalance: "",
  spending: "",
  portfolio: "",
  contribution: "",
  currency: "",
  annualReturn: "5",
  inflation: "2",
  fee: "0.3",
};
export type FireFieldKey = keyof typeof fireFieldDefaults;
export type FireFieldValues = Record<FireFieldKey, string>;

// Leave in-progress decimals alone. On blur, remove only redundant integer zeros,
// preserving signs, decimal precision and exponent syntax.
export function normalizedNumber(event: FocusEvent<HTMLInputElement>): string | null {
  const input = event.currentTarget;
  if (input.validity.badInput) return null;
  const normalized = input.value.replace(/^(-?)0+(?=\d)/, "$1");
  return normalized === input.value ? null : normalized;
}

type NumberFieldProps = {
  field: FireFieldKey;
  label: string;
  values: FireFieldValues;
  onChange: (field: FireFieldKey, value: string, normalized?: boolean) => void;
  optional?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number | null;
  step?: number;
};

function FireNumberField({
  field,
  label,
  values,
  onChange,
  optional = false,
  disabled,
  min = 0,
  max = 1e12,
  step = 0.01,
}: NumberFieldProps) {
  return (
    <label className="fire-field">
      <span>{label}</span>
      <input
        data-field={field}
        type="number"
        value={values[field]}
        onChange={(event) => onChange(field, event.currentTarget.value)}
        onBlur={(event) => {
          const normalized = normalizedNumber(event);
          if (normalized !== null) onChange(field, normalized, true);
        }}
        placeholder={optional ? "0" : undefined}
        min={min}
        max={max ?? undefined}
        step={step}
        required={!optional}
        disabled={disabled}
      />
    </label>
  );
}

type Props = {
  copy: FireCopy;
  values: FireFieldValues;
  onChange: (field: FireFieldKey, value: string, normalized?: boolean) => void;
  ageGoal: boolean;
  preserve: boolean;
};

export function FireFields({ copy, values, onChange, ageGoal, preserve }: Props) {
  const shared = { values, onChange };
  return (
    <>
      <fieldset className="fire-fieldset">
        <legend>{copy.inputs}</legend>
        <div className="fire-fields">
          <FireNumberField
            {...shared}
            field="currentAge"
            label={copy.currentAge}
            max={null}
            step={1}
          />
          <div hidden={ageGoal}>
            <FireNumberField
              {...shared}
              field="retirementAge"
              label={copy.retirementAge}
              max={null}
              step={1}
              disabled={ageGoal}
            />
          </div>
          <FireNumberField
            {...shared}
            field="endAge"
            label={copy.endAge}
            min={1}
            max={null}
            step={1}
          />
          <div hidden={preserve}>
            <FireNumberField
              {...shared}
              field="endBalance"
              label={copy.endBalance}
              optional
              disabled={preserve}
            />
          </div>
          <FireNumberField {...shared} field="spending" label={copy.spending} />
          <FireNumberField {...shared} field="portfolio" label={copy.portfolio} optional />
          <FireNumberField {...shared} field="contribution" label={copy.contribution} optional />
          <label className="fire-field">
            <span>{copy.currency}</span>
            <input
              data-field="currency"
              type="text"
              maxLength={12}
              placeholder={copy.currencyPlaceholder}
              autoComplete="off"
              value={values.currency}
              onChange={(event) => onChange("currency", event.currentTarget.value)}
            />
          </label>
        </div>
        <p className="fire-help">{copy.moneyHelp}</p>
      </fieldset>
      <fieldset className="fire-fieldset">
        <legend>{copy.returns}</legend>
        <div className="fire-fields fire-fields--rates">
          <FireNumberField
            {...shared}
            field="annualReturn"
            label={copy.annualReturn}
            min={-50}
            max={30}
          />
          <FireNumberField {...shared} field="inflation" label={copy.inflation} min={-5} max={30} />
          <FireNumberField {...shared} field="fee" label={copy.fee} max={10} />
        </div>
        <p className="fire-help">{copy.returnHelp}</p>
      </fieldset>
    </>
  );
}
