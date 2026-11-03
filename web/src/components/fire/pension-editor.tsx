import type { FocusEvent } from "react";
import type { FireCopy } from "@/content/fire";
import type { Pension } from "@/features/fire/model";
import { PencilIcon, TrashIcon } from "@/components/ui-icons";
import { normalizedNumber } from "./fire-fields";

export type PensionKind = Pension["kind"];
export type PensionDraft = {
  kind: PensionKind;
  name: string;
  monthly: string;
  startAge: string;
  endAge: string;
  indexed: boolean;
};
export type PensionRow = {
  id: string;
  number: number;
  // The add button that created the row gets focus back when it disappears.
  addKind: PensionKind;
  draft: PensionDraft;
  // Accepted values live only in page memory. Editors are drafts, not storage.
  accepted: Pension | null;
  editing: boolean;
  invalid: boolean;
};

export type PensionActions = {
  onAdd: (kind: PensionKind) => void;
  onDraft: (id: string, draft: Partial<PensionDraft>, normalized?: boolean) => void;
  onSave: (id: string, editor: HTMLFieldSetElement) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
};

type Props = PensionActions & {
  copy: FireCopy;
  rows: PensionRow[];
  money: (value: number) => string;
  ready: boolean;
};

const kinds: PensionKind[] = ["government", "employer", "other"];

export function PensionEditor({ copy, rows, money, ready, onAdd, ...actions }: Props) {
  const addLabel = {
    government: copy.addGovernment,
    employer: copy.addEmployer,
    other: copy.addOther,
  };
  return (
    <fieldset className="fire-fieldset fire-pensions">
      <legend>{copy.pensions}</legend>
      <p className="fire-help">{copy.pensionHelp}</p>
      <p className="fire-help">{copy.pensionSaveHelp}</p>
      <div data-pension-list role="list">
        {rows.map((row) => (
          <PensionItem key={row.id} copy={copy} row={row} money={money} {...actions} />
        ))}
      </div>
      <p className="fire-help" data-pension-empty hidden={rows.length > 0}>
        {copy.emptyPensions}
      </p>
      <div className="fire-pension-actions">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            data-add-pension={kind}
            disabled={!ready}
            onClick={() => onAdd(kind)}
          >
            {addLabel[kind]}
          </button>
        ))}
      </div>
      <p className="fire-help">{copy.fixedHelp}</p>
    </fieldset>
  );
}

function PensionItem({
  copy,
  row,
  money,
  onDraft,
  onSave,
  onEdit,
  onCancel,
  onRemove,
}: Omit<PensionActions, "onAdd"> & {
  copy: FireCopy;
  row: PensionRow;
  money: (value: number) => string;
}) {
  const { id, draft, accepted, editing } = row;
  const editorId = `${id}-editor`;
  const title = accepted ? accepted.name.trim() || copy[accepted.kind] : "";
  const actionLabel = (action: string) => `${action} ${row.number}${title ? `: ${title}` : ""}`;
  const numberInput = (key: "monthly" | "startAge" | "endAge") => ({
    "data-pension-field": key,
    type: "number",
    value: draft[key],
    onChange: (event: { currentTarget: HTMLInputElement }) =>
      onDraft(id, { [key]: event.currentTarget.value }),
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      const normalized = normalizedNumber(event);
      if (normalized !== null) onDraft(id, { [key]: normalized }, true);
    },
  });

  return (
    <div className="fire-pension-item" role="listitem" data-pension-id={id} data-editing={editing}>
      {accepted && (
        <div className="fire-pension-summary" data-pension-summary hidden={editing}>
          <div className="fire-pension-description">
            <strong data-pension-summary-name>{title}</strong>
            <span data-pension-summary-source hidden={!accepted.name.trim()}>
              {copy[accepted.kind]}
            </span>
            <span data-pension-summary-amount>{`${money(accepted.monthly)} ${copy.perMonth}`}</span>
            <span data-pension-summary-ages>
              {`${copy.age}: ${accepted.startAge}–${accepted.endAge}`}
            </span>
            <span data-pension-summary-indexing>
              {accepted.indexed ? copy.indexed : copy.fixedPayout}
            </span>
          </div>
          <div className="fire-pension-summary-actions">
            <button
              type="button"
              data-edit-pension
              aria-label={actionLabel(copy.editPension)}
              title={actionLabel(copy.editPension)}
              aria-controls={editorId}
              aria-expanded={editing}
              onClick={() => onEdit(id)}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              data-remove-pension
              aria-label={actionLabel(copy.remove)}
              title={actionLabel(copy.remove)}
              onClick={() => onRemove(id)}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}
      <fieldset
        className="fire-pension-row"
        id={editorId}
        data-pension-editor
        hidden={!editing}
        disabled={!editing}
      >
        <legend data-pension-title>{`${copy.pension} ${row.number}`}</legend>
        <div className="fire-fields">
          <label className="fire-field">
            <span>{copy.kind}</span>
            <select
              data-pension-field="kind"
              value={draft.kind}
              onChange={(event) => onDraft(id, { kind: event.currentTarget.value as PensionKind })}
            >
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {copy[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="fire-field">
            <span>{copy.name}</span>
            <input
              type="text"
              data-pension-field="name"
              maxLength={80}
              autoComplete="off"
              value={draft.name}
              onChange={(event) => onDraft(id, { name: event.currentTarget.value })}
            />
          </label>
          <label className="fire-field">
            <span>{copy.monthlyPayout}</span>
            <input {...numberInput("monthly")} min={0} max={1e12} step={0.01} placeholder="0" />
          </label>
          <label className="fire-field">
            <span>{copy.startAge}</span>
            <input {...numberInput("startAge")} min={0} step={1} required />
          </label>
          <label className="fire-field">
            <span>{copy.stopAge}</span>
            <input
              {...numberInput("endAge")}
              min={1}
              step={1}
              required
              aria-invalid={row.invalid || undefined}
            />
          </label>
        </div>
        <div className="fire-pension-row-actions">
          <label className="fire-checkbox">
            <input
              type="checkbox"
              data-pension-field="indexed"
              checked={draft.indexed}
              onChange={(event) => onDraft(id, { indexed: event.currentTarget.checked })}
            />
            <span>{copy.indexed}</span>
          </label>
          <div className="fire-pension-editor-buttons">
            <button
              type="button"
              data-save-pension
              onClick={(event) => {
                const editor = event.currentTarget.closest("fieldset");
                if (editor) onSave(id, editor);
              }}
            >
              {copy.savePension}
            </button>
            <button type="button" data-cancel-pension onClick={() => onCancel(id)}>
              {copy.cancelPension}
            </button>
          </div>
        </div>
        <p className="fire-help fire-warning" data-pension-error role="status">
          {row.invalid ? copy.error_pensions : ""}
        </p>
      </fieldset>
    </div>
  );
}
