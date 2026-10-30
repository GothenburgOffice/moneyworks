import type { FireCopy } from '@/content/fire';

export function PensionEditor({ copy }: { copy: FireCopy }) {
  return (
    <fieldset className="fire-fieldset fire-pensions">
      <legend>{copy.pensions}</legend>
      <p className="fire-help">{copy.pensionHelp}</p>
      <p className="fire-help">{copy.pensionSaveHelp}</p>
      <div data-pension-list role="list" />
      <p className="fire-help" data-pension-empty>{copy.emptyPensions}</p>
      <div className="fire-pension-actions">
        <button type="button" data-add-pension="government" disabled>{copy.addGovernment}</button>
        <button type="button" data-add-pension="employer" disabled>{copy.addEmployer}</button>
        <button type="button" data-add-pension="other" disabled>{copy.addOther}</button>
      </div>
      <p className="fire-help">{copy.fixedHelp}</p>
      <fieldset data-pension-template hidden disabled>
        <div className="fire-pension-item" role="listitem">
          <div className="fire-pension-summary" data-pension-summary hidden>
            <div className="fire-pension-description">
              <strong data-pension-summary-name />
              <span data-pension-summary-source />
              <span data-pension-summary-amount />
              <span data-pension-summary-ages />
              <span data-pension-summary-indexing />
            </div>
            <div className="fire-pension-summary-actions">
              <button type="button" data-edit-pension>{copy.editPension}</button>
              <button type="button" data-remove-pension>{copy.remove}</button>
            </div>
          </div>
        <fieldset className="fire-pension-row" data-pension-editor>
          <legend data-pension-title>{copy.pension}</legend>
          <div className="fire-fields">
            <label className="fire-field">
              <span>{copy.kind}</span>
              <select data-pension-field="kind" defaultValue="government">
                <option value="government">{copy.government}</option>
                <option value="employer">{copy.employer}</option>
                <option value="other">{copy.other}</option>
              </select>
            </label>
            <label className="fire-field">
              <span>{copy.name}</span>
              <input type="text" data-pension-field="name" maxLength={80} autoComplete="off" />
            </label>
            <label className="fire-field">
              <span>{copy.monthlyPayout}</span>
              <input type="number" data-pension-field="monthly" min={0} max={1e12} step={.01} placeholder="0" />
            </label>
            <label className="fire-field">
              <span>{copy.startAge}</span>
              <input type="number" data-pension-field="startAge" min={0} max={119} step={1} required />
            </label>
            <label className="fire-field">
              <span>{copy.stopAge}</span>
              <input type="number" data-pension-field="endAge" min={1} max={120} step={1} defaultValue={95} required />
            </label>
          </div>
          <div className="fire-pension-row-actions">
            <label className="fire-checkbox">
              <input type="checkbox" data-pension-field="indexed" defaultChecked />
              <span>{copy.indexed}</span>
            </label>
            <div className="fire-pension-editor-buttons">
              <button type="button" data-save-pension>{copy.savePension}</button>
              <button type="button" data-cancel-pension>{copy.cancelPension}</button>
            </div>
          </div>
          <p className="fire-help fire-warning" data-pension-error role="status" />
        </fieldset>
        </div>
      </fieldset>
    </fieldset>
  );
}
