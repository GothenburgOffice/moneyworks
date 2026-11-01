/* global fireModel */
const { calculateFire, isValidPension } = fireModel;
function initializeFire() {
  const root = document.querySelector("[data-fire]");
  if (root) {
    const copy = JSON.parse(root.dataset.fireCopy);
    const locale = root.dataset.fireLocale === "sv" ? "sv-SE" : "en-GB";
    const form = root.querySelector("[data-fire-form]");
    const list = root.querySelector("[data-pension-list]");
    const resultPanel = root.querySelector("[data-fire-result]");
    const status = root.querySelector("[data-fire-status]");
    const field = (key) => form.querySelector(`[data-field="${key}"]`);
    const text = (selector, value) => {
      root.querySelector(selector).textContent = value;
    };
    const rateNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const regularNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const largeNumber = new Intl.NumberFormat(locale, {
      notation: "scientific",
      maximumFractionDigits: 0,
    });
    const compactNumber = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 0,
    });
    const number = (value) =>
      (Math.abs(value) >= 1e15 ? largeNumber : regularNumber).format(
        Math.abs(value) < 0.5 ? 0 : value,
      );
    const currency = () => field("currency").value.trim() || copy.units;
    const money = (value) => `${number(value)} ${currency()}`;
    let nextId = 0;
    // Accepted values live only in this page. Editors are drafts, not storage.
    const savedPensions = new Map();
    let chartData = null;
    let lastCalculation = null;
    let resultPhase = "retirement";
    const stale = () => {
      resultPanel.hidden = true;
      chartData = null;
      lastCalculation = null;
      status.textContent = copy.changed;
      status.classList.remove("fire-warning", "sr-only");
    };
    function updateChoices() {
      const ageMode = form.querySelector('[name="fire-goal"]:checked').value === "age";
      const preserve = form.querySelector('[name="fire-strategy"]:checked').value === "preserve";
      root.querySelector("[data-retirement-field]").hidden = ageMode;
      field("retirementAge").disabled = ageMode;
      root.querySelector("[data-end-balance-field]").hidden = preserve;
      field("endBalance").disabled = preserve;
    }
    function updatePensionList() {
      const count = list.children.length;
      root.querySelector("[data-pension-empty]").hidden = count > 0;
    }
    function updateSummary(row) {
      const pension = savedPensions.get(row.dataset.pensionId);
      if (!pension) return;
      const title = pension.name.trim() || copy[pension.kind];
      const put = (key, value) => {
        row.querySelector(`[data-pension-summary-${key}]`).textContent = value;
      };
      put("name", title);
      put("source", copy[pension.kind]);
      row.querySelector("[data-pension-summary-source]").hidden = !pension.name.trim();
      put("amount", `${money(pension.monthly)} ${copy.perMonth}`);
      put("ages", `${copy.age}: ${pension.startAge}–${pension.endAge}`);
      put("indexing", pension.indexed ? copy.indexed : copy.fixedPayout);
      for (const [selector, action] of [
        ["[data-edit-pension]", copy.editPension],
        ["[data-remove-pension]", copy.remove],
      ]) {
        const button = row.querySelector(selector);
        const label = `${action} ${row.dataset.pensionNumber}: ${title}`;
        button.setAttribute("aria-label", label);
        button.title = label;
      }
    }
    function setEditing(row, editing) {
      const editor = row.querySelector("[data-pension-editor]");
      editor.id = `${row.dataset.pensionId}-editor`;
      const editButton = row.querySelector("[data-edit-pension]");
      editButton.setAttribute("aria-controls", editor.id);
      editButton.setAttribute("aria-expanded", String(editing));
      const amount = editor.querySelector('[data-pension-field="monthly"]');
      if (editing && amount.value !== "" && Number(amount.value) === 0) amount.value = "";
      row.dataset.editing = String(editing);
      editor.hidden = !editing;
      editor.disabled = !editing;
      row.querySelector("[data-pension-summary]").hidden = editing;
      row.querySelector("[data-pension-error]").textContent = "";
      editor
        .querySelectorAll("[aria-invalid]")
        .forEach((input) => input.removeAttribute("aria-invalid"));
    }
    function savePension(row) {
      const editor = row.querySelector("[data-pension-editor]");
      const invalid = [...editor.querySelectorAll("input, select")].find(
        (input) => !input.checkValidity(),
      );
      if (invalid) {
        invalid.reportValidity();
        return;
      }
      const value = (key) => row.querySelector(`[data-pension-field="${key}"]`);
      const pension = {
        id: row.dataset.pensionId,
        kind: value("kind").value,
        name: value("name").value,
        monthly: Number(value("monthly").value),
        startAge: Number(value("startAge").value),
        endAge: Number(value("endAge").value),
        indexed: value("indexed").checked,
      };
      if (!isValidPension(pension)) {
        row.querySelector("[data-pension-error]").textContent = copy.error_pensions;
        value("endAge").setAttribute("aria-invalid", "true");
        value("endAge").focus();
        return;
      }
      savedPensions.set(pension.id, pension);
      updateSummary(row);
      setEditing(row, false);
      stale();
      row.querySelector("[data-edit-pension]").focus();
    }
    root.querySelectorAll("[data-add-pension]").forEach((button) => {
      button.disabled = false;
      button.addEventListener("click", () => {
        const row = root.querySelector("[data-pension-template]").firstElementChild.cloneNode(true);
        row.dataset.pensionId = `pension-${++nextId}`;
        row.dataset.pensionNumber = String(nextId);
        row.querySelector("[data-pension-title]").textContent = `${copy.pension} ${nextId}`;
        row.querySelector('[data-pension-field="kind"]').value = button.dataset.addPension;
        row.querySelector('[data-pension-field="endAge"]').value = field("endAge").value;
        const remove = row.querySelector("[data-remove-pension]");
        remove.setAttribute("aria-label", `${copy.remove} ${nextId}`);
        remove.addEventListener("click", () => {
          savedPensions.delete(row.dataset.pensionId);
          row.remove();
          updatePensionList();
          stale();
          button.focus();
        });
        row.querySelector("[data-save-pension]").addEventListener("click", () => savePension(row));
        row.querySelector("[data-edit-pension]").addEventListener("click", () => {
          setEditing(row, true);
          stale();
          row.querySelector("select").focus();
        });
        row.querySelector("[data-cancel-pension]").addEventListener("click", () => {
          const accepted = savedPensions.get(row.dataset.pensionId);
          if (!accepted) {
            row.remove();
            updatePensionList();
            button.focus();
          } else {
            for (const key of ["kind", "name", "monthly", "startAge", "endAge", "indexed"]) {
              const input = row.querySelector(`[data-pension-field="${key}"]`);
              if (key === "indexed") input.checked = accepted[key];
              else input.value = key === "monthly" && accepted[key] === 0 ? "" : accepted[key];
            }
            setEditing(row, false);
            row.querySelector("[data-edit-pension]").focus();
          }
          stale();
        });
        setEditing(row, true);
        list.append(row);
        updatePensionList();
        stale();
        row.querySelector("select").focus();
      });
    });
    function readPlan() {
      // Required fields are checked first; optional blank amounts mean zero.
      const numeric = (key) => Number(field(key).value);
      const goal = form.querySelector('[name="fire-goal"]:checked').value;
      const strategy = form.querySelector('[name="fire-strategy"]:checked').value;
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
        pensions: [...savedPensions.values()],
      };
    }
    function drawChart(rows, startAge, endAge, title, hint, initial, target = null) {
      const svg = root.querySelector("[data-fire-chart]");
      const width = Math.max(240, svg.clientWidth);
      const left = 70,
        right = width - 12;
      svg.setAttribute("viewBox", `0 0 ${width} 270`);
      svg.replaceChildren();
      const make = (tag, attrs, content) => {
        const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
        if (content !== undefined) node.textContent = content;
        svg.append(node);
        return node;
      };
      svg.setAttribute("aria-label", title);
      make("title", {}, title);
      make("desc", {}, `${hint} ${copy.age}: ${startAge}–${endAge}.`);
      const values = [rows[0]?.opening ?? initial, ...rows.map((row) => row.closing)];
      const peak = values.reduce(
        (maximum, value) => Math.max(maximum, value),
        Math.max(1, target ?? 0),
      );
      const maximum = peak <= Number.MAX_VALUE / 1.1 ? peak * 1.1 : peak;
      const duration = endAge - startAge;
      const x = (age) =>
        duration === 0 ? (left + right) / 2 : left + ((age - startAge) / duration) * (right - left);
      const y = (value) => 220 - (Math.max(0, value) / maximum) * 190;
      for (let i = 0; i <= 4; i++) {
        const value = (maximum * i) / 4;
        make("line", { x1: left, x2: right, y1: y(value), y2: y(value), class: "fire-chart-grid" });
        make(
          "text",
          { x: left - 10, y: y(value) + 4, "text-anchor": "end", class: "fire-chart-label" },
          (value >= 1e15 ? largeNumber : compactNumber).format(value),
        );
      }
      const labelWidth = Math.max(number(startAge).length, number(endAge).length) * 7 + 18;
      const steps = Math.min(4, duration, Math.max(1, Math.floor((right - left) / labelWidth)));
      for (let i = 0; i <= steps; i++) {
        const age = steps === 0 ? startAge : Math.round(startAge + (duration * i) / steps);
        make(
          "text",
          {
            x: x(age),
            y: 245,
            "text-anchor":
              duration === 0 ? "middle" : i === 0 ? "start" : i === steps ? "end" : "middle",
            class: "fire-chart-label",
          },
          number(age),
        );
      }
      make("text", { x: left, y: 15, class: "fire-chart-label" }, currency());
      make("text", { x: right, y: 265, "text-anchor": "end", class: "fire-chart-label" }, copy.age);
      if (target !== null) {
        make("line", {
          x1: left,
          x2: right,
          y1: y(target),
          y2: y(target),
          class: "fire-chart-target",
        });
        make(
          "text",
          { x: right, y: y(target) - 8, "text-anchor": "end", class: "fire-chart-label" },
          copy.targetLine,
        );
      }
      make("polyline", {
        points: values.map((value, index) => `${x(startAge + index)},${y(value)}`).join(" "),
        class: "fire-chart-line",
        fill: "none",
        "stroke-width": 2.5,
        "stroke-dasharray": "6 4",
      });
      if (values.length === 1)
        make("circle", { cx: x(startAge), cy: y(values[0]), r: 3.5, class: "fire-chart-point" });
    }
    function renderPhase() {
      if (!lastCalculation) return;
      const { result, plan } = lastCalculation;
      const savings = resultPhase === "savings";
      const rows = savings ? result.savingsRows : result.rows;
      const title = savings ? copy.savingsChart : copy.chart;
      const hint = savings ? copy.savingsChartHint : copy.chartHint;
      const yearly = savings ? copy.savingsYearly : copy.yearly;
      root.dataset.firePhase = resultPhase;
      root.querySelectorAll("[data-result-phase]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.resultPhase === resultPhase));
      });
      root.querySelectorAll("[data-saving-metric]").forEach((metric) => {
        metric.hidden = !savings;
      });
      root.querySelector("[data-retirement-end-metric]").hidden = savings;
      root.querySelector("[data-retirement-surplus]").hidden = savings;
      root.querySelector("[data-result-saving-help]").hidden = !savings;
      root.querySelector("[data-result-saving-empty]").hidden = !savings || rows.length > 0;
      root.querySelector("[data-result-saving-unavailable]").hidden =
        !savings || rows.length === 0 || result.monthlySavingNeeded !== null;
      root.querySelector("[data-result-outside]").hidden = savings || !result.outsidePensions;
      text("[data-result-contribution]", money(plan.contribution));
      text(
        "[data-result-saving-needed]",
        result.monthlySavingNeeded === null
          ? copy.notAvailable
          : money(Math.ceil(result.monthlySavingNeeded)),
      );
      text(
        "[data-result-saving-gap]",
        money(Math.max(0, result.required - result.projectedSavings)),
      );
      text(
        "[data-result-age]",
        savings
          ? `${copy.startAge} ${plan.currentAge} · ${copy.stopAge} ${result.retirementAge}`
          : `${copy.atAge.replace("{age}", result.retirementAge)} · ${copy.throughAge.replace("{age}", plan.endAge)}`,
      );
      text(
        "[data-result-path]",
        savings ? copy.savingsPath : plan.goal === "age" ? copy.actualPath : copy.requiredPath,
      );
      text("[data-fire-chart-title]", title);
      text("[data-fire-chart-hint]", hint);
      const tableHead = root.querySelector("[data-fire-table-head]");
      tableHead.replaceChildren();
      const labels = savings
        ? [copy.age, copy.opening, copy.contributions, copy.growth, copy.closing]
        : [
            copy.age,
            copy.opening,
            copy.pensionIncome,
            copy.annualSpending,
            copy.growth,
            copy.closing,
          ];
      for (const label of labels) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        tableHead.append(th);
      }
      text(".fire-yearly summary", yearly);
      text(".fire-yearly caption", yearly);
      root.querySelector(".fire-table-scroll").setAttribute("aria-label", yearly);
      const tbody = root.querySelector("[data-fire-table]");
      tbody.replaceChildren();
      const tableRows = document.createDocumentFragment();
      for (const row of rows) {
        const tr = document.createElement("tr");
        const rounded = (value) => Math.sign(value) * Math.round(Math.abs(value));
        const opening = rounded(row.opening),
          closing = rounded(row.closing);
        const income = rounded(savings ? row.contribution : row.pension);
        const spending = savings ? 0 : rounded(row.spending);
        // Reconcile whole-unit rows without changing the model. For extreme
        // amounts, retain finite model growth instead of unsafe integer sums.
        const growth = [opening, closing, income, spending].every(Number.isSafeInteger)
          ? rounded(closing - opening - income + spending)
          : rounded(row.growth);
        const values = savings
          ? [row.age, opening, income, growth, closing]
          : [row.age, opening, income, spending, growth, closing];
        for (const [index, value] of values.entries()) {
          const cell = document.createElement("td");
          cell.textContent = index === 0 ? String(value) : number(value);
          tr.append(cell);
        }
        tableRows.append(tr);
      }
      tbody.append(tableRows);
      chartData = [
        rows,
        savings ? plan.currentAge : result.retirementAge,
        savings ? result.retirementAge : plan.endAge,
        title,
        hint,
        savings ? plan.portfolio : result.rows[0].opening,
        savings ? result.required : null,
      ];
      drawChart(...chartData);
    }
    function render(result, plan) {
      resultPanel.hidden = true;
      lastCalculation = null;
      chartData = null;
      status.classList.remove("fire-warning", "sr-only");
      if (!result.ok) {
        status.textContent = copy[`error_${result.error}`];
        status.classList.add("fire-warning");
        return;
      }
      if (result.retirementAge === null || result.required === null) {
        status.textContent = `${plan.goal === "age" ? copy.noAge : copy.noSolution} ${copy.noSolutionHelp}`;
        status.classList.add("fire-warning");
        return;
      }
      status.textContent = `${plan.goal === "age" ? copy.ageResult : copy.required}: ${plan.goal === "age" ? result.retirementAge : money(result.required)}.`;
      status.classList.add("sr-only");
      text("[data-result-label]", plan.goal === "age" ? copy.ageResult : copy.required);
      text(
        "[data-result-primary]",
        plan.goal === "age" ? String(result.retirementAge) : money(result.required),
      );
      text(
        "[data-result-age]",
        `${copy.atAge.replace("{age}", result.retirementAge)} · ${copy.throughAge.replace("{age}", plan.endAge)}`,
      );
      text("[data-result-funded]", result.funded ? copy.funded : copy.gap);
      root.querySelector("[data-result-funded]").classList.toggle("fire-warning", !result.funded);
      text("[data-result-required]", money(result.required));
      root.querySelector("[data-required-metric]").hidden = plan.goal === "portfolio";
      text("[data-result-savings]", money(result.projectedSavings));
      text("[data-result-end]", money(result.endPortfolio));
      text(
        "[data-result-return]",
        `${rateNumber.format(Math.abs(result.realReturn) < 0.005 ? 0 : result.realReturn)}%`,
      );
      resultPanel.hidden = false;
      lastCalculation = { result, plan };
      renderPhase();
      resultPanel.focus({ preventScroll: true });
      resultPanel.scrollIntoView({ block: "start", behavior: "auto" });
    }
    form.addEventListener("focusout", (event) => {
      const input = event.target;
      if (
        input instanceof HTMLInputElement &&
        input.type === "number" &&
        !input.validity.badInput
      ) {
        // Leave in-progress decimals/caret alone. On blur, remove only redundant
        // integer zeros, preserving signs, decimal precision and exponent syntax.
        const normalized = input.value.replace(/^(-?)0+(?=\d)/, "$1");
        if (normalized !== input.value) input.value = normalized;
      }
    });
    form.addEventListener("input", (event) => {
      if (event.target === field("currency")) [...list.children].forEach(updateSummary);
      stale();
    });
    form.addEventListener("change", (event) => {
      updateChoices();
      // Text/number input already invalidates on input. Its later blur/change
      // must not hide the fresh result when Enter moves focus into that result.
      if (
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLInputElement &&
          ["checkbox", "radio"].includes(event.target.type))
      )
        stale();
    });
    const runCalculation = () => {
      const open = list.querySelector('[data-editing="true"]');
      if (open) {
        status.textContent = copy.unsavedPensions;
        status.classList.remove("sr-only");
        status.classList.add("fire-warning");
        open.querySelector("[data-save-pension]").focus();
        return;
      }
      if (!form.reportValidity()) {
        status.textContent = copy.invalid;
        return;
      }
      const plan = readPlan();
      render(calculateFire(plan), plan);
    };
    root.querySelector("[data-fire-calculate]").addEventListener("click", runCalculation);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      runCalculation();
    });
    // Enter saves the payout row being edited, or calculates from anywhere else.
    form.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        event.target instanceof HTMLInputElement &&
        !["checkbox", "radio"].includes(event.target.type)
      ) {
        event.preventDefault();
        const row = event.target.closest("[data-pension-id]");
        if (row) savePension(row);
        else runCalculation();
      }
    });
    root.querySelector("[data-fire-reset]").addEventListener("click", () => {
      form.reset();
      list.replaceChildren();
      savedPensions.clear();
      chartData = null;
      lastCalculation = null;
      resultPhase = "retirement";
      updateChoices();
      updatePensionList();
      resultPanel.hidden = true;
      status.textContent = copy.waiting;
      status.classList.remove("fire-warning", "sr-only");
      field("spending").focus();
    });
    root.querySelector("[data-fire-calculate]").disabled = false;
    root.querySelector("[data-fire-reset]").disabled = false;
    root.querySelectorAll("[data-result-phase]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!lastCalculation) return;
        resultPhase = button.dataset.resultPhase;
        renderPhase();
      });
    });
    window.addEventListener("resize", () => {
      if (chartData && !resultPanel.hidden) drawChart(...chartData);
    });
    updateChoices();
  }
}
// Next's streamed document can finish mounting after a deferred script loads.
// Initialize after load/paint rather than mutating the SSR controls mid-mount.
const initializeAfterPaint = () =>
  requestAnimationFrame(() => requestAnimationFrame(initializeFire));
if (document.readyState === "complete") initializeAfterPaint();
else window.addEventListener("load", initializeAfterPaint, { once: true });
