import type { FireCopy } from "@/content/fire";

type NumberFieldProps = {
  field: string;
  label: string;
  value?: number | string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number | null;
  step?: number;
};
export function FireNumberField({
  field,
  label,
  value = "",
  placeholder,
  required = true,
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
        defaultValue={value}
        placeholder={placeholder}
        min={min}
        max={max ?? undefined}
        step={step}
        required={required}
      />
    </label>
  );
}

export function FireFields({ copy }: { copy: FireCopy }) {
  return (
    <>
      <fieldset className="fire-fieldset">
        <legend>{copy.inputs}</legend>
        <div className="fire-fields">
          <FireNumberField
            field="currentAge"
            label={copy.currentAge}
            value={35}
            max={null}
            step={1}
          />
          <div data-retirement-field>
            <FireNumberField
              field="retirementAge"
              label={copy.retirementAge}
              value={55}
              max={null}
              step={1}
            />
          </div>
          <FireNumberField
            field="endAge"
            label={copy.endAge}
            value={95}
            min={1}
            max={null}
            step={1}
          />
          <div data-end-balance-field>
            <FireNumberField
              field="endBalance"
              label={copy.endBalance}
              placeholder="0"
              required={false}
            />
          </div>
          <FireNumberField field="spending" label={copy.spending} />
          <FireNumberField
            field="portfolio"
            label={copy.portfolio}
            placeholder="0"
            required={false}
          />
          <FireNumberField
            field="contribution"
            label={copy.contribution}
            placeholder="0"
            required={false}
          />
          <label className="fire-field">
            <span>{copy.currency}</span>
            <input
              data-field="currency"
              type="text"
              maxLength={12}
              placeholder={copy.currencyPlaceholder}
              autoComplete="off"
            />
          </label>
        </div>
        <p className="fire-help">{copy.moneyHelp}</p>
      </fieldset>
      <fieldset className="fire-fieldset">
        <legend>{copy.returns}</legend>
        <div className="fire-fields fire-fields--rates">
          <FireNumberField
            field="annualReturn"
            label={copy.annualReturn}
            value={5}
            min={-50}
            max={30}
          />
          <FireNumberField field="inflation" label={copy.inflation} value={2} min={-5} max={30} />
          <FireNumberField field="fee" label={copy.fee} value={0.3} max={10} />
        </div>
        <p className="fire-help">{copy.returnHelp}</p>
      </fieldset>
    </>
  );
}
