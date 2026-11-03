"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import type { FireCopy } from "@/content/fire";
import type { Locale } from "@/content/site";
import { calculateFire, isValidPension, type FirePlan, type Pension } from "@/features/fire/model";
import { FireFields, fireFieldDefaults, type FireFieldKey } from "./fire-fields";
import { fireFormatters } from "./fire-format";
import { FireResults, type FireCalculation, type FirePhase, type FireStatus } from "./fire-results";
import {
  PensionEditor,
  type PensionDraft,
  type PensionKind,
  type PensionRow,
} from "./pension-editor";

type Props = { copy: FireCopy; locale: Locale };

const noSubscription = () => () => {};

// False on the server and during hydration, true once React handles events.
function useHydrated() {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

export function FireWorkspace({ copy, locale }: Props) {
  const ready = useHydrated();
  const root = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const resultPanel = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  // Focus moves after React has rendered the element it targets.
  const pendingFocus = useRef<string | null>(null);
  const scrollToResult = useRef(false);

  const [goal, setGoal] = useState<FirePlan["goal"]>("portfolio");
  const [strategy, setStrategy] = useState<FirePlan["strategy"]>("drawdown");
  const [values, setValues] = useState(fireFieldDefaults);
  const [pensions, setPensions] = useState<PensionRow[]>([]);
  const [status, setStatus] = useState<FireStatus>({
    text: copy.waiting,
    warning: false,
    hidden: false,
  });
  const [calculation, setCalculation] = useState<FireCalculation | null>(null);
  const [phase, setPhase] = useState<FirePhase>("retirement");

  const format = fireFormatters(locale);
  const currency = values.currency.trim() || copy.units;
  const money = (value: number) => `${format.number(value)} ${currency}`;

  useEffect(() => {
    if (pendingFocus.current) {
      root.current?.querySelector<HTMLElement>(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
    if (scrollToResult.current && resultPanel.current) {
      resultPanel.current.focus({ preventScroll: true });
      resultPanel.current.scrollIntoView({ block: "start", behavior: "auto" });
      scrollToResult.current = false;
    }
  });

  const focusAfterRender = (selector: string) => {
    pendingFocus.current = selector;
  };
  const row = (id: string) => `[data-pension-id="${id}"]`;
  const updateRow = (id: string, change: (current: PensionRow) => PensionRow) =>
    setPensions((rows) => rows.map((current) => (current.id === id ? change(current) : current)));

  const stale = () => {
    setCalculation(null);
    setStatus({ text: copy.changed, warning: false, hidden: false });
  };

  function addPension(kind: PensionKind) {
    const number = ++nextId.current;
    const id = `pension-${number}`;
    setPensions((rows) => [
      ...rows,
      {
        id,
        number,
        addKind: kind,
        draft: {
          kind,
          name: "",
          monthly: "",
          startAge: "",
          endAge: values.endAge,
          indexed: true,
        },
        accepted: null,
        editing: true,
        invalid: false,
      },
    ]);
    stale();
    focusAfterRender(`${row(id)} select`);
  }

  function savePension(id: string, editor: HTMLFieldSetElement) {
    const current = pensions.find((pension) => pension.id === id);
    if (!current) return;
    const invalid = [...editor.querySelectorAll("input, select")].find(
      (input) => !(input as HTMLInputElement | HTMLSelectElement).checkValidity(),
    ) as HTMLInputElement | HTMLSelectElement | undefined;
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    const { draft } = current;
    const pension: Pension = {
      id,
      kind: draft.kind,
      name: draft.name,
      monthly: Number(draft.monthly),
      startAge: Number(draft.startAge),
      endAge: Number(draft.endAge),
      indexed: draft.indexed,
    };
    if (!isValidPension(pension)) {
      updateRow(id, (row) => ({ ...row, invalid: true }));
      editor.querySelector<HTMLElement>('[data-pension-field="endAge"]')?.focus();
      return;
    }
    updateRow(id, (row) => ({ ...row, accepted: pension, editing: false, invalid: false }));
    stale();
    focusAfterRender(`${row(id)} [data-edit-pension]`);
  }

  function editPension(id: string) {
    updateRow(id, (row) => ({
      ...row,
      editing: true,
      invalid: false,
      draft:
        row.draft.monthly !== "" && Number(row.draft.monthly) === 0
          ? { ...row.draft, monthly: "" }
          : row.draft,
    }));
    stale();
    focusAfterRender(`${row(id)} select`);
  }

  function cancelPension(id: string) {
    const current = pensions.find((pension) => pension.id === id);
    if (!current) return;
    const { accepted } = current;
    if (!accepted) {
      setPensions((rows) => rows.filter((pension) => pension.id !== id));
      focusAfterRender(`[data-add-pension="${current.addKind}"]`);
    } else {
      const draft: PensionDraft = {
        kind: accepted.kind,
        name: accepted.name,
        monthly: accepted.monthly === 0 ? "" : String(accepted.monthly),
        startAge: String(accepted.startAge),
        endAge: String(accepted.endAge),
        indexed: accepted.indexed,
      };
      updateRow(id, (row) => ({ ...row, draft, editing: false, invalid: false }));
      focusAfterRender(`${row(id)} [data-edit-pension]`);
    }
    stale();
  }

  function removePension(id: string) {
    const current = pensions.find((pension) => pension.id === id);
    if (!current) return;
    setPensions((rows) => rows.filter((pension) => pension.id !== id));
    stale();
    focusAfterRender(`[data-add-pension="${current.addKind}"]`);
  }

  function readPlan(): FirePlan {
    // Required fields are checked first; optional blank amounts mean zero.
    const numeric = (key: FireFieldKey) => Number(values[key]);
    return {
      goal,
      strategy,
      currentAge: numeric("currentAge"),
      retirementAge: goal === "age" ? numeric("currentAge") : numeric("retirementAge"),
      endAge: numeric("endAge"),
      portfolio: numeric("portfolio"),
      contribution: numeric("contribution"),
      spending: numeric("spending"),
      endBalance: strategy === "preserve" ? 0 : numeric("endBalance"),
      annualReturn: numeric("annualReturn"),
      inflation: numeric("inflation"),
      fee: numeric("fee"),
      pensions: pensions.flatMap((pension) => (pension.accepted ? [pension.accepted] : [])),
    };
  }

  function calculate() {
    const open = pensions.find((pension) => pension.editing);
    if (open) {
      setStatus({ text: copy.unsavedPensions, warning: true, hidden: false });
      root.current?.querySelector<HTMLElement>(`${row(open.id)} [data-save-pension]`)?.focus();
      return;
    }
    if (!form.current?.reportValidity()) {
      setStatus({ text: copy.invalid, warning: false, hidden: false });
      return;
    }
    const plan = readPlan();
    const result = calculateFire(plan);
    setCalculation(null);
    if (!result.ok) {
      setStatus({ text: copy[`error_${result.error}`], warning: true, hidden: false });
      return;
    }
    const ageGoal = plan.goal === "age";
    if (result.retirementAge === null || result.required === null) {
      setStatus({
        text: `${ageGoal ? copy.noAge : copy.noSolution} ${copy.noSolutionHelp}`,
        warning: true,
        hidden: false,
      });
      return;
    }
    const answer = ageGoal ? String(result.retirementAge) : money(result.required);
    setStatus({
      text: `${ageGoal ? copy.ageResult : copy.required}: ${answer}.`,
      warning: false,
      hidden: true,
    });
    setCalculation({
      plan,
      result: { ...result, retirementAge: result.retirementAge, required: result.required },
    });
    scrollToResult.current = true;
  }

  function reset() {
    setGoal("portfolio");
    setStrategy("drawdown");
    setValues(fireFieldDefaults);
    setPensions([]);
    setCalculation(null);
    setPhase("retirement");
    setStatus({ text: copy.waiting, warning: false, hidden: false });
    focusAfterRender('[data-field="spending"]');
  }

  // Enter saves the payout row being edited, or calculates from anywhere else.
  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      event.key !== "Enter" ||
      !(target instanceof HTMLInputElement) ||
      ["checkbox", "radio"].includes(target.type)
    )
      return;
    event.preventDefault();
    const pension = target.closest<HTMLElement>("[data-pension-id]");
    const editor = target.closest("fieldset[data-pension-editor]");
    if (pension?.dataset.pensionId && editor instanceof HTMLFieldSetElement)
      savePension(pension.dataset.pensionId, editor);
    else calculate();
  }

  const choice = (
    name: string,
    selected: string,
    options: [string, string][],
    set: (value: string) => void,
  ) =>
    options.map(([value, label]) => (
      <label key={value}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={selected === value}
          onChange={() => {
            set(value);
            stale();
          }}
        />
        {label}
      </label>
    ));

  return (
    <div className="fire-workspace" ref={root}>
      <form
        ref={form}
        className="fire-form"
        action="#fire-calculator"
        autoComplete="off"
        data-fire-form
        onKeyDown={handleKeyDown}
        onSubmit={(event: SyntheticEvent) => {
          event.preventDefault();
          calculate();
        }}
      >
        <fieldset className="fire-choice">
          <legend>{copy.question}</legend>
          {choice(
            "fire-goal",
            goal,
            [
              ["portfolio", copy.portfolioGoal],
              ["age", copy.ageGoal],
            ],
            (value) => setGoal(value as FirePlan["goal"]),
          )}
        </fieldset>
        <fieldset className="fire-choice">
          <legend>{copy.strategy}</legend>
          {choice(
            "fire-strategy",
            strategy,
            [
              ["drawdown", copy.drawdown],
              ["preserve", copy.preserve],
            ],
            (value) => setStrategy(value as FirePlan["strategy"]),
          )}
        </fieldset>
        <p className="fire-help">{copy.strategyHelp}</p>
        <FireFields
          copy={copy}
          values={values}
          ageGoal={goal === "age"}
          preserve={strategy === "preserve"}
          onChange={(field, value, normalized) => {
            setValues((current) => ({ ...current, [field]: value }));
            // Blur normalization keeps the same number, so the result stays current.
            if (!normalized) stale();
          }}
        />
        <PensionEditor
          copy={copy}
          rows={pensions}
          money={money}
          ready={ready}
          onAdd={addPension}
          onDraft={(id, draft, normalized) => {
            updateRow(id, (row) => ({ ...row, draft: { ...row.draft, ...draft } }));
            if (!normalized) stale();
          }}
          onSave={savePension}
          onEdit={editPension}
          onCancel={cancelPension}
          onRemove={removePension}
        />
        <div className="fire-actions">
          <button
            type="button"
            className="button-primary"
            data-fire-calculate
            disabled={!ready}
            onClick={calculate}
          >
            {copy.calculate}
          </button>
          <button type="button" data-fire-reset disabled={!ready} onClick={reset}>
            {copy.reset}
          </button>
        </div>
        <p className="fire-help">{copy.privacy}</p>
        <noscript>
          <p className="fire-warning">{copy.noJS}</p>
        </noscript>
      </form>
      <FireResults
        copy={copy}
        format={format}
        currency={currency}
        status={status}
        calculation={calculation}
        phase={phase}
        onPhase={setPhase}
        resultRef={resultPanel}
      />
    </div>
  );
}
