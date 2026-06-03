(function () {
  "use strict";

  const CONFIG = {
    pageLength: 100,
    delayScienceMs: 1200,
    delayPageMs: 2200,
    delayTabMs: 500,
    delayCloseMs: 1800,
    dateFilter: {
      enabled: false,
      date: "",
      columnNames: ["Data da Distribuicao", "Data da Distribuição", "Recebido"],
      timeSuffix: " - 00:00",
    },
    filters: {
      tribunalColumn: "tribunal",
      jurisdictionColumn: "jurisdicao",
      cejuscText: "CEJUSC",
    },
    scienceSelector:
      "form.take-consciousness-btn button, " +
      "form.take-consciousness-btn input[type='submit'], " +
      "form.take-consciousness-btn a, " +
      "button.take-consciousness-btn, " +
      "a.take-consciousness-btn, " +
      "input.take-consciousness-btn",
    scienceFallbackSelector: "form.take-consciousness-btn, .take-consciousness-btn",
    rowSelector: "#procedures-box tbody tr.group-item:visible",
    expedienteSelector:
      "a[data-original-title^='Ler Expediente'], " +
      "a[title^='Ler Expediente'], " +
      "a",
    encerrarMarkerText: "ENCERRAR",
    encerramentoText: "Sugerir encerramento de tarefa",
    encerramentoStepId: "2756",
  };

  const state = {
    running: false,
    stopped: false,
    logs: [],
  };

  const originalConfirm = window.SPA_CDSP_ORIGINAL_CONFIRM || window.confirm;
  const originalAlert = window.SPA_CDSP_ORIGINAL_ALERT || window.alert;
  window.SPA_CDSP_ORIGINAL_CONFIRM = originalConfirm;
  window.SPA_CDSP_ORIGINAL_ALERT = originalAlert;

  window.confirm = function (message) {
    log("Confirm aceito automaticamente: " + (message || ""));
    return true;
  };

  window.alert = function (message) {
    log("Alert interceptado: " + (message || ""));
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDate(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return iso[3] + "/" + iso[2] + "/" + iso[1];

    const br = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return br[1] + "/" + br[2] + "/" + br[3];

    return text;
  }

  function currentDateFilter() {
    const enabledInput = document.querySelector("#spa-cdsp-use-date");
    const dateInput = document.querySelector("#spa-cdsp-date");
    const enabled = enabledInput ? enabledInput.checked : CONFIG.dateFilter.enabled;
    const date = normalizeDate(dateInput ? dateInput.value : CONFIG.dateFilter.date);

    if (!enabled || !date) return null;
    return {
      date,
      values: [date + CONFIG.dateFilter.timeSuffix, date],
    };
  }

  function currentCustomFilters() {
    const tribunal1 = document.querySelector("#spa-cdsp-filter-tribunal-1");
    const tribunal2 = document.querySelector("#spa-cdsp-filter-tribunal-2");
    const cejusc = document.querySelector("#spa-cdsp-filter-cejusc");

    return {
      tribunal1: Boolean(tribunal1 && tribunal1.checked),
      tribunal2: Boolean(tribunal2 && tribunal2.checked),
      cejusc: Boolean(cejusc && cejusc.checked),
      deadlineStatuses: currentDeadlineFilters(),
    };
  }

  function currentDeadlineFilters() {
    const options = [
      ["long", "#spa-cdsp-deadline-long"],
      ["short", "#spa-cdsp-deadline-short"],
      ["late", "#spa-cdsp-deadline-late"],
      ["none", "#spa-cdsp-deadline-none"],
    ];
    const selected = options
      .filter((item) => {
        const input = document.querySelector(item[1]);
        return Boolean(input && input.checked);
      })
      .map((item) => item[0]);

    if (selected.length) return selected;

    const legacySelect = document.querySelector("#spa-cdsp-deadline-filter");
    return legacySelect && legacySelect.value ? [legacySelect.value] : [];
  }

  function hasCustomFilters(filters) {
    return Boolean(
      filters.tribunal1 ||
        filters.tribunal2 ||
        filters.cejusc ||
        filters.deadlineStatuses.length
    );
  }

  function activeFilterLabels(filters) {
    const labels = [];
    if (filters.tribunal1) labels.push("Tribunal: 1o Grau");
    if (filters.tribunal2) labels.push("Tribunal: 2o Grau");
    if (filters.cejusc) labels.push("Jurisdicao: CEJUSC");
    if (filters.deadlineStatuses.indexOf("long") >= 0) labels.push("Prazo: azul");
    if (filters.deadlineStatuses.indexOf("short") >= 0) labels.push("Prazo: amarelo");
    if (filters.deadlineStatuses.indexOf("late") >= 0) labels.push("Prazo: vermelho");
    if (filters.deadlineStatuses.indexOf("none") >= 0) labels.push("Prazo: sem prazo");
    return labels;
  }

  function logCustomFilters() {
    const labels = activeFilterLabels(currentCustomFilters());
    if (labels.length) {
      log("Filtros ativos: " + labels.join("; ") + ".");
    } else {
      log("Sem filtros condicionais ativos.");
    }
  }

  function normalizeLimit(value) {
    const number = parseInt(value, 10);
    if (!Number.isFinite(number) || number <= 0) return 0;
    return number;
  }

  function currentActionLimit() {
    const input = document.querySelector("#spa-cdsp-limit");
    return normalizeLimit(input ? input.value : 0);
  }

  function logActionLimit(limit) {
    if (limit) {
      log("Limite definido pelo painel: " + limit + " numero(s) de processo.");
    } else {
      log("Sem limite de quantidade: a acao seguira ate o fim da lista.");
    }
  }

  function storageGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_error) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_error) {
      // Sem armazenamento local, o script continua funcionando na sessao atual.
    }
  }

  function log(message, type) {
    const text = "[" + new Date().toLocaleTimeString() + "] " + message;
    state.logs.push(text);
    console.log("[SPA-CDSP]", message);
    const box = document.querySelector("#spa-cdsp-log");
    if (box) {
      const line = document.createElement("div");
      line.textContent = text;
      if (type === "error") line.style.color = "#ffb4b4";
      if (type === "ok") line.style.color = "#b9f6ca";
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
  }

  function setStatus(text) {
    const status = document.querySelector("#spa-cdsp-status");
    if (status) status.textContent = text;
  }

  function ensureJquery() {
    if (!window.jQuery) {
      throw new Error("jQuery nao encontrado. Rode este script dentro da pagina do SPA ja carregada.");
    }
    return window.jQuery;
  }

  function getDataTable() {
    const $ = ensureJquery();
    if (window.dtProceduresBox) return window.dtProceduresBox;
    if ($.fn.DataTable && $("#procedures-box").length) return $("#procedures-box").DataTable();
    throw new Error("DataTable #procedures-box nao encontrado.");
  }

  async function waitProcessingDone() {
    const started = Date.now();
    while (Date.now() - started < 30000) {
      const processing = document.querySelector("#procedures-box_processing");
      const visible =
        processing &&
        window.getComputedStyle(processing).display !== "none" &&
        window.getComputedStyle(processing).visibility !== "hidden";
      if (!visible) return;
      await sleep(250);
    }
    log("Tempo de espera excedido aguardando carregamento da tabela.", "error");
  }

  function findSearchInputForColumn(columnName) {
    const wanted = normalizeText(columnName).toLowerCase();
    const inputs = Array.from(document.querySelectorAll("input.search-by-column"));

    for (const input of inputs) {
      const name = input.getAttribute("name") || "";
      const match = name.match(/^search_by_column\[(.*)\]$/);
      const actual = match ? match[1] : "";
      if (normalizeText(actual).toLowerCase() === wanted) return input;
    }

    const headers = Array.from(document.querySelectorAll("#procedures-box th[data-name]"));
    const header = headers.find(
      (item) => normalizeText(item.getAttribute("data-name")).toLowerCase() === wanted
    );
    if (!header) return null;

    const exactName = header.getAttribute("data-name");
    return inputs.find((input) => (input.getAttribute("name") || "") === "search_by_column[" + exactName + "]");
  }

  async function applyDateFilterIfNeeded() {
    const filter = currentDateFilter();
    if (!filter) return;

    for (const columnName of CONFIG.dateFilter.columnNames) {
      const input = findSearchInputForColumn(columnName);
      if (!input) continue;

      const value = filter.values.join("|");
      if (input.value !== value) {
        log("Aplicando filtro de data em '" + columnName + "': " + filter.date + ".");
        input.value = value;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(CONFIG.delayPageMs);
        await waitProcessingDone();
      } else {
        log("Filtro de data ja aplicado: " + filter.date + ".");
      }
      return;
    }

    log("Filtro nativo de data nao encontrado. Usarei filtro por linha: " + filter.date + ".");
  }

  async function setPageLength() {
    const dt = getDataTable();
    const current = dt.page.len();
    if (current !== CONFIG.pageLength) {
      log("Alterando paginacao para " + CONFIG.pageLength + ".");
      dt.page.len(CONFIG.pageLength).draw(false);
      await sleep(CONFIG.delayPageMs);
      await waitProcessingDone();
    }

    const select = document.querySelector("select[name='procedures-box_length']");
    if (select && String(select.value) !== String(CONFIG.pageLength)) {
      select.value = String(CONFIG.pageLength);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(CONFIG.delayPageMs);
      await waitProcessingDone();
    }
  }

  function expandGroupsIfPresent() {
    const button = document.querySelector("#expand-all-groups");
    if (button) button.click();
  }

  async function goFirstPage() {
    const dt = getDataTable();
    if (dt.page.info().page !== 0) {
      log("Voltando para a primeira pagina.");
      dt.page("first").draw("page");
      await sleep(CONFIG.delayPageMs);
      await waitProcessingDone();
    }
  }

  async function goNextPage() {
    const dt = getDataTable();
    const info = dt.page.info();
    if (info.page >= info.pages - 1) return false;
    log("Indo para a proxima pagina.");
    dt.page("next").draw("page");
    await sleep(CONFIG.delayPageMs);
    await waitProcessingDone();
    return true;
  }

  async function softRefreshProcedures() {
    const dt = getDataTable();
    let refreshed = false;

    if (dt.ajax && typeof dt.ajax.reload === "function") {
      try {
        log("Atualizando a lista interna do SPA, sem recarregar a aba.");
        dt.ajax.reload(null, false);
        refreshed = true;
      } catch (error) {
        log("Atualizacao interna por AJAX falhou. Tentando redesenhar a tabela: " + error.message);
      }
    }

    if (!refreshed) {
      log("Redesenhando a tabela do SPA, sem recarregar a aba.");
      dt.draw(false);
    }

    await sleep(CONFIG.delayPageMs);
    await waitProcessingDone();
    await setPageLength();
    await applyDateFilterIfNeeded();
    expandGroupsIfPresent();
    log("Lista atualizada. O painel continua carregado.", "ok");
  }

  async function refreshProceduresTable() {
    guardStart();
    try {
      setStatus("Atualizando lista...");
      await softRefreshProcedures();
      setStatus("Lista atualizada");
    } catch (error) {
      log("Erro ao atualizar a lista: " + error.message, "error");
      setStatus("Erro ao atualizar");
    } finally {
      state.running = false;
    }
  }

  function rows() {
    const $ = ensureJquery();
    return $(CONFIG.rowSelector).toArray().filter(rowMatchesAllFilters);
  }

  function getRowGroup(row) {
    let previous = row.previousElementSibling;
    while (previous && previous.classList.contains("group-item")) {
      previous = previous.previousElementSibling;
    }
    return previous && previous.classList.contains("group-row") ? previous : null;
  }

  function rowGroupText(row) {
    const group = getRowGroup(row);
    if (!group) return "";
    return (group.textContent || "") + " " + (group.getAttribute("data-group") || "");
  }

  function findColumnIndex(normalizedNames) {
    const wanted = normalizedNames.map((name) => normalizeText(name).toLowerCase());
    const headers = Array.from(document.querySelectorAll("#procedures-box th[data-name]"));

    for (const header of headers) {
      const name = normalizeText(header.getAttribute("data-name") || "").toLowerCase();
      if (wanted.indexOf(name) < 0) continue;

      const index = parseInt(header.getAttribute("data-index"), 10);
      if (Number.isFinite(index)) return index;
    }

    return -1;
  }

  function elementFullText(element) {
    const pieces = [];
    if (!element) return "";
    element.querySelectorAll("span[data-full-text], [data-full-text]").forEach((child) => {
      pieces.push(child.getAttribute("data-full-text") || child.textContent || "");
    });
    pieces.push(element.getAttribute("data-full-text") || element.textContent || "");
    return pieces.join(" ");
  }

  function rowColumnText(row, normalizedNames) {
    const index = findColumnIndex(normalizedNames);
    if (index < 0 || !row.children[index]) return "";
    return elementFullText(row.children[index]);
  }

  function rowSearchText(row) {
    const pieces = [];
    row.querySelectorAll("span[data-full-text], td").forEach((element) => {
      pieces.push(element.getAttribute("data-full-text") || element.textContent || "");
    });
    pieces.push(rowGroupText(row));
    return pieces.join(" ");
  }

  function rowTextForDate(row) {
    return rowSearchText(row);
  }

  function rowMatchesDateFilter(row) {
    const filter = currentDateFilter();
    if (!filter) return true;

    const text = rowTextForDate(row);
    const normalized = normalizeText(text);
    const hyphen = filter.date.replace(/\//g, "-");
    const groupKey = filter.date.replace(/\//g, "-") + "---00-00";
    const reversedGroupKey = filter.date.split("/").join("-");

    return (
      normalized.indexOf(filter.date) >= 0 ||
      normalized.indexOf(hyphen) >= 0 ||
      normalized.indexOf(groupKey) >= 0 ||
      normalized.indexOf(reversedGroupKey) >= 0
    );
  }

  function textHasGrau(text, grau) {
    const normalized = normalizeText(text).toLowerCase().replace(/[º°]/g, "");
    return normalized.indexOf(grau + " grau") >= 0 || normalized.indexOf(grau + "o grau") >= 0;
  }

  function rowDeadlineElement(row) {
    const deadlineIndex = findColumnIndex(["deadline"]);
    const cell = deadlineIndex >= 0 ? row.children[deadlineIndex] : null;
    if (!cell) return null;
    return (
      cell.querySelector("[class*='deadline-procedure-'] a.badge") ||
      cell.querySelector("a.badge[href*='calendars'], span.badge, a.badge, .btn-danger, .btn-warning, .btn-primary")
    );
  }

  function deadlineText(row, element) {
    const cellIndex = findColumnIndex(["deadline"]);
    const cell = cellIndex >= 0 ? row.children[cellIndex] : null;
    return [
      element ? element.textContent || "" : "",
      element ? element.getAttribute("data-content") || "" : "",
      element ? element.getAttribute("data-original-title") || "" : "",
      cell ? cell.textContent || "" : "",
    ].join(" ");
  }

  function parseDeadlineDate(text) {
    const normalized = normalizeText(text);
    const specific = normalized.match(/Prazo para manifestacao:\s*(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?/i);
    const generic = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?/);
    const match = specific || generic;
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hour = parseInt(match[4] || "23", 10);
    const minute = parseInt(match[5] || "59", 10);
    return new Date(year, month, day, hour, minute, 0, 0);
  }

  function rowDeadlineStatus(row) {
    const element = rowDeadlineElement(row);
    if (!element) return "none";

    const classes = String(element.className || "").toLowerCase();
    if (classes.indexOf("danger") >= 0) return "late";
    if (classes.indexOf("warning") >= 0) return "short";
    if (
      classes.indexOf("primary") >= 0 ||
      classes.indexOf("info") >= 0 ||
      classes.indexOf("success") >= 0
    ) {
      return "long";
    }

    const due = parseDeadlineDate(deadlineText(row, element));
    if (due && due.getTime() < Date.now()) return "late";
    return "";
  }

  function rowMatchesCustomFilters(row) {
    const filters = currentCustomFilters();
    if (!hasCustomFilters(filters)) return true;

    const tribunalText = rowColumnText(row, [CONFIG.filters.tribunalColumn]) + " " + rowGroupText(row);
    if (filters.tribunal1 || filters.tribunal2) {
      const matchesTribunal =
        (filters.tribunal1 && textHasGrau(tribunalText, "1")) ||
        (filters.tribunal2 && textHasGrau(tribunalText, "2"));
      if (!matchesTribunal) return false;
    }

    if (filters.cejusc) {
      const jurisdictionText =
        rowColumnText(row, [CONFIG.filters.jurisdictionColumn]) || rowSearchText(row);
      if (normalizeText(jurisdictionText).toUpperCase().indexOf(CONFIG.filters.cejuscText) < 0) {
        return false;
      }
    }

    if (
      filters.deadlineStatuses.length &&
      filters.deadlineStatuses.indexOf(rowDeadlineStatus(row)) < 0
    ) {
      return false;
    }

    return true;
  }

  function rowMatchesAllFilters(row) {
    return rowMatchesDateFilter(row) && rowMatchesCustomFilters(row);
  }

  function rowInfo(row) {
    const checkbox = row.querySelector("input.procedure-inbox-checkbox[value], input[name^='procedure_inbox_']");
    const id = row.getAttribute("data-procedure-id") || (checkbox ? checkbox.value : "");
    const first = row.querySelector("td.cursor-pointer span[data-full-text]");
    const assunto = first ? first.getAttribute("data-full-text") || first.textContent.trim() : "";
    return { id, assunto };
  }

  function activateScience(row) {
    const target =
      row.querySelector(CONFIG.scienceSelector) ||
      row.querySelector(CONFIG.scienceFallbackSelector);

    if (!target) return false;

    const tag = target.tagName.toLowerCase();
    if (tag === "form") {
      const clickable = target.querySelector("button, input[type='submit'], a");
      if (clickable) {
        clickable.click();
        return true;
      }
      if (target.requestSubmit) {
        target.requestSubmit();
        return true;
      }
      return false;
    }

    target.click();
    return true;
  }

  function extractProcessNumber(text) {
    const match = normalizeText(text).match(/\d{7}-\d{2}\.\d{4}\.\d{1,2}\.\d{2}\.\d{4}/);
    return match ? match[0] : "";
  }

  function rowProcessNumber(row) {
    return (
      extractProcessNumber(rowGroupText(row)) ||
      extractProcessNumber(rowColumnText(row, ["numero do processo", "processo"])) ||
      extractProcessNumber(rowSearchText(row)) ||
      rowProcedureKey(row)
    );
  }

  function rowsByProcess(pageRows) {
    const grouped = new Map();

    pageRows.forEach((row) => {
      const key = rowProcessNumber(row);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    });

    return Array.from(grouped.entries()).map(([key, processRows]) => ({
      key: key,
      rows: processRows,
    }));
  }

  function processLogLabel(processKey, processRows) {
    if (processKey) return processKey;
    if (!processRows || !processRows.length) return "processo sem identificacao";
    const info = rowInfo(processRows[0]);
    return info.id || info.assunto || "processo sem identificacao";
  }

  async function takeScienceCurrentPage(limit, processedProcessKeys) {
    const pageRows = rows();
    const pageProcesses = rowsByProcess(pageRows);
    const seen = processedProcessKeys || new Set();
    let count = 0;
    log(
      "Linhas visiveis na pagina: " +
        pageRows.length +
        ". Numeros de processo: " +
        pageProcesses.length +
        "."
    );

    for (const processItem of pageProcesses) {
      if (state.stopped) break;
      if (limit && count >= limit) break;
      if (seen.has(processItem.key)) continue;

      seen.add(processItem.key);
      const label = processLogLabel(processItem.key, processItem.rows);
      let processTotal = 0;

      log("Dando ciencia no processo " + label + " (" + processItem.rows.length + " pendencia(s)).");

      for (const row of processItem.rows) {
        if (state.stopped) break;

        const info = rowInfo(row);
        const ok = activateScience(row);
        if (ok) {
          processTotal += 1;
          log("Ciencia acionada: " + (info.id || info.assunto || label), "ok");
          await sleep(CONFIG.delayScienceMs);
          await waitProcessingDone();
        } else {
          log("Sem botao de ciencia: " + (info.id || info.assunto || label));
        }
      }

      if (processTotal) {
        count += 1;
        log("Processo contabilizado para ciencia: " + label + ".", "ok");
      }
    }

    return count;
  }

  async function takeScienceAllPages(limit) {
    guardStart();
    try {
      limit = normalizeLimit(limit);
      logActionLimit(limit);
      logCustomFilters();
      setStatus("Dando ciencias...");
      await setPageLength();
      await applyDateFilterIfNeeded();
      await goFirstPage();
      expandGroupsIfPresent();

      let total = 0;
      let pageNumber = 1;
      const processedProcessKeys = new Set();

      while (!state.stopped) {
        log("Fase ciencia, pagina " + pageNumber + ".");
        const remaining = limit ? Math.max(0, limit - total) : 0;
        const pageTotal = await takeScienceCurrentPage(remaining, processedProcessKeys);
        total += pageTotal;

        if (limit && total >= limit) {
          log("Limite de ciencias atingido (" + limit + ").");
          break;
        }

        const next = await goNextPage();
        if (!next) break;
        pageNumber += 1;
      }

      log("Fase de ciencia concluida. Numeros de processo acionados: " + total + ".", "ok");
      setStatus("Ciencias concluidas: " + total);
    } catch (error) {
      log("Erro na fase de ciencia: " + error.message, "error");
      setStatus("Erro na fase de ciencia");
    } finally {
      state.running = false;
    }
  }

  function getProcedureUrl(row) {
    try {
      const $ = ensureJquery();
      const dt = getDataTable();
      const data = dt.row(row).data();
      if (!Array.isArray(data)) return "";
      const item = data.find((x) => x && typeof x === "object" && x.procedure_url);
      return item ? item.procedure_url : "";
    } catch (_error) {
      return "";
    }
  }

  function openInNewTab(url) {
    const opened = window.open(url, "_blank");
    return Boolean(opened);
  }

  function sortByScreenPosition(elements) {
    return elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return { element, index, x: rect.left, y: Math.round(rect.top / 10) * 10 };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x || a.index - b.index)
      .map((item) => item.element);
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function getExpedientes(row) {
    return Array.from(row.querySelectorAll(CONFIG.expedienteSelector)).filter((element) => {
      if (!isVisible(element)) return false;
      const title = element.getAttribute("data-original-title") || element.getAttribute("title") || "";
      if (title.indexOf("Ler Expediente") === 0) return true;
      return Boolean(element.querySelector("i.zmdi-file"));
    });
  }

  function rowProcedureKey(row) {
    const info = rowInfo(row);
    if (info.id) return info.id;

    const link = row.querySelector("a[href*='/procedures/']");
    const href = link ? link.getAttribute("href") || "" : "";
    const procedure = href.match(/\/procedures\/(\d+)/);
    if (procedure) return procedure[1];

    return info.assunto || normalizeText(row.textContent).slice(0, 80);
  }

  function rowHasEncerrarMarker(row) {
    const markerText = normalizeText(CONFIG.encerrarMarkerText).toUpperCase();
    const markerElements = Array.from(
      row.querySelectorAll(".zmdi-marker, .icon-marker-style, .text-marker, .span-marker-name, [title]")
    );

    return markerElements.some((element) => {
      const text = normalizeText(
        (element.getAttribute("title") || "") + " " + (element.textContent || "")
      ).toUpperCase();
      return text.indexOf(markerText) >= 0;
    });
  }

  function markedProcessKeysCurrentPage(processedRowKeys) {
    const keys = [];
    const seen = new Set();

    rows().forEach((row) => {
      const rowKey = rowProcedureKey(row);
      if (!rowHasEncerrarMarker(row) || processedRowKeys.has(rowKey)) return;

      const processKey = rowProcessNumber(row);
      if (seen.has(processKey)) return;

      seen.add(processKey);
      keys.push(processKey);
    });

    return keys;
  }

  function nextMarkedRowForProcess(processKey, processedRowKeys) {
    return rows().find((row) => {
      const rowKey = rowProcedureKey(row);
      return (
        rowProcessNumber(row) === processKey &&
        rowHasEncerrarMarker(row) &&
        !processedRowKeys.has(rowKey)
      );
    });
  }

  function getEncerramentoLink(row) {
    const wantedText = normalizeText(CONFIG.encerramentoText).toLowerCase();
    const wantedStep = "step_id=" + CONFIG.encerramentoStepId;
    const links = Array.from(row.querySelectorAll("a.dropdown-item, a[data-remote='true'], a[href]"));

    return (
      links.find((link) => {
        const href = link.href || link.getAttribute("href") || "";
        const text = normalizeText(link.textContent).toLowerCase();
        return (
          href.indexOf("archive_procedure") >= 0 &&
          href.indexOf(wantedStep) >= 0 &&
          text.indexOf(wantedText) >= 0
        );
      }) ||
      links.find((link) => {
        const href = link.href || link.getAttribute("href") || "";
        return href.indexOf("archive_procedure") >= 0 && href.indexOf(wantedStep) >= 0;
      })
    );
  }

  function isModalShown(modal) {
    if (!modal) return false;
    const style = window.getComputedStyle(modal);
    const rect = modal.getBoundingClientRect();
    return (
      modal.classList.contains("show") ||
      modal.getAttribute("aria-hidden") === "false" ||
      style.display !== "none" ||
      rect.width > 0 ||
      rect.height > 0
    );
  }

  function findEncerramentoModal() {
    const wantedText = normalizeText(CONFIG.encerramentoText).toLowerCase();
    const modals = Array.from(document.querySelectorAll(".modal"));

    return (
      modals.find((modal) => {
        if (!isModalShown(modal)) return false;
        const text = normalizeText(modal.textContent).toLowerCase();
        return text.indexOf(wantedText) >= 0;
      }) ||
      modals.find((modal) => {
        if (!isModalShown(modal)) return false;
        return Boolean(findSaveButton(modal));
      }) ||
      null
    );
  }

  async function waitForEncerramentoModal() {
    const started = Date.now();
    while (Date.now() - started < 20000) {
      const modal = findEncerramentoModal();
      if (modal) return modal;
      await sleep(250);
    }

    return null;
  }

  function findSaveButton(container) {
    const candidates = Array.from(
      container.querySelectorAll(
        "input[type='submit'][value='Salvar'], " +
          "input[name='commit'], " +
          "button[type='submit'], " +
          ".modal-footer .btn-primary"
      )
    );

    return candidates.find((button) => {
      if (!isVisible(button)) return false;
      const label = normalizeText(button.value || button.textContent || button.getAttribute("data-disable-with"));
      return label === "Salvar" || label.indexOf("Salvar") >= 0;
    });
  }

  async function waitForModalToClose(modal) {
    const started = Date.now();
    while (Date.now() - started < 30000) {
      await waitProcessingDone();
      if (!document.body.contains(modal) || !isModalShown(modal)) return true;
      await sleep(350);
    }

    return false;
  }

  async function closeMarkedRow(row) {
    if (!rowHasEncerrarMarker(row)) {
      log("Linha ignorada: marcador ENCERRAR nao encontrado.");
      return false;
    }

    const link = getEncerramentoLink(row);
    const info = rowInfo(row);
    const label = info.id || info.assunto || "linha sem id";

    if (!link) {
      log("Opcao de encerramento nao encontrada: " + label, "error");
      return false;
    }

    const arrow = row.querySelector(
      "[data-original-title='Proximo passo'] [data-toggle='dropdown'], " +
        ".zmdi-arrow-right[data-toggle='dropdown']"
    );

    if (arrow) {
      arrow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      await sleep(250);
    }

    log("Abrindo encerramento: " + label + ".");
    link.click();

    const modal = await waitForEncerramentoModal();
    if (!modal) {
      log("Janela de encerramento nao abriu: " + label, "error");
      return false;
    }

    const save = findSaveButton(modal);
    if (!save) {
      throw new Error("Botao Salvar nao encontrado no encerramento: " + label);
    }

    save.scrollIntoView({ block: "center", inline: "nearest" });
    await sleep(200);
    save.click();
    log("Salvar acionado no encerramento: " + label + ".", "ok");

    const closed = await waitForModalToClose(modal);
    if (!closed) {
      throw new Error("Janela de encerramento permaneceu aberta: " + label);
    }

    await sleep(CONFIG.delayCloseMs);
    return true;
  }

  async function closeMarkedCurrentPage(limit, processedProcessKeys, processedRowKeys) {
    const seenProcesses = processedProcessKeys || new Set();
    const seenRows = processedRowKeys || new Set();
    let count = 0;

    while (!state.stopped) {
      if (limit && count >= limit) break;

      const processKey = markedProcessKeysCurrentPage(seenRows).find((key) => !seenProcesses.has(key));
      if (!processKey) break;

      seenProcesses.add(processKey);
      let processTotal = 0;
      let attempts = 0;

      log("Encerrando processo " + processKey + " e todas as pendencias marcadas dele.");

      while (!state.stopped) {
        const row = nextMarkedRowForProcess(processKey, seenRows);
        if (!row) break;

        const rowKey = rowProcedureKey(row);
        seenRows.add(rowKey);
        attempts += 1;

        const ok = await closeMarkedRow(row);
        if (ok) processTotal += 1;
        await sleep(CONFIG.delayCloseMs);
      }

      if (processTotal) {
        count += 1;
        log(
          "Processo contabilizado no encerramento: " +
            processKey +
            " (" +
            processTotal +
            " pendencia(s)).",
          "ok"
        );
      } else if (attempts) {
        log("Nenhuma pendencia foi encerrada para o processo " + processKey + ".", "error");
      }
    }

    return count;
  }

  async function closeMarkedAllPages(limit) {
    guardStart();
    try {
      limit = normalizeLimit(limit);
      logActionLimit(limit);
      logCustomFilters();
      setStatus("Encerrando marcados...");
      await setPageLength();
      await applyDateFilterIfNeeded();
      await goFirstPage();
      expandGroupsIfPresent();

      let total = 0;
      let pageNumber = 1;
      const processedProcessKeys = new Set();
      const processedRowKeys = new Set();

      while (!state.stopped) {
        const visibleMarked = rows().filter(rowHasEncerrarMarker).length;
        log("Fase encerramento, pagina " + pageNumber + ". Marcados visiveis: " + visibleMarked + ".");

        const remaining = limit ? Math.max(0, limit - total) : 0;
        const pageTotal = await closeMarkedCurrentPage(remaining, processedProcessKeys, processedRowKeys);
        total += pageTotal;

        if (limit && total >= limit) {
          log("Limite de encerramentos atingido (" + limit + ").");
          break;
        }

        const next = await goNextPage();
        if (!next) break;
        pageNumber += 1;
      }

      if (!total) {
        log("Nenhum processo com marcador ENCERRAR foi encerrado.", "error");
      } else {
        log("Fase de encerramento concluida. Numeros de processo encerrados: " + total + ".", "ok");
      }
      setStatus("Encerramentos concluidos: " + total);
    } catch (error) {
      log("Erro na fase de encerramento: " + error.message, "error");
      setStatus("Erro no encerramento");
    } finally {
      state.running = false;
    }
  }

  async function openTabsForRow(row) {
    let blocked = 0;
    const info = rowInfo(row);
    const label = info.id || info.assunto || "linha sem id";

    const procedureUrl = getProcedureUrl(row);
    if (procedureUrl) {
      if (openInNewTab(procedureUrl)) {
        log("Pendencia aberta: " + label, "ok");
      } else {
        blocked += 1;
        log("Navegador bloqueou a aba da pendencia: " + label, "error");
      }
    } else {
      const cell = row.querySelector("td.cursor-pointer");
      if (cell) {
        cell.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true, button: 0 }));
        log("Pendencia clicada por celula: " + label, "ok");
      } else {
        log("Pendencia nao encontrada: " + label, "error");
      }
    }

    await sleep(CONFIG.delayTabMs);

    const expedientes = sortByScreenPosition(getExpedientes(row));

    if (!expedientes.length) {
      log("Sem expediente visivel: " + label);
    }

    for (const expediente of expedientes) {
      const title =
        expediente.getAttribute("data-original-title") ||
        expediente.getAttribute("title") ||
        "Ler Expediente";

      if (expediente.href) {
        if (openInNewTab(expediente.href)) {
          log(title + " aberto.", "ok");
        } else {
          blocked += 1;
          log("Navegador bloqueou aba: " + title, "error");
        }
      } else {
        expediente.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true, button: 0 }));
        log(title + " clicado.", "ok");
      }

      await sleep(CONFIG.delayTabMs);
    }

    return { blocked: blocked };
  }

  async function openTabsCurrentPage(limit, processedProcessKeys) {
    const pageRows = rows();
    const pageProcesses = rowsByProcess(pageRows);
    const seen = processedProcessKeys || new Set();
    let count = 0;
    let blocked = 0;

    log(
      "Abrindo abas de " +
        pageProcesses.length +
        " numero(s) de processo (" +
        pageRows.length +
        " pendencia(s) visiveis)."
    );

    for (const processItem of pageProcesses) {
      if (state.stopped) break;
      if (limit && count >= limit) break;
      if (seen.has(processItem.key)) continue;

      seen.add(processItem.key);
      const label = processLogLabel(processItem.key, processItem.rows);
      log("Abrindo processo " + label + " (" + processItem.rows.length + " pendencia(s)).");

      for (const row of processItem.rows) {
        if (state.stopped) break;

        const result = await openTabsForRow(row);
        blocked += result.blocked;
      }

      count += 1;
      log("Processo contabilizado na abertura de abas: " + label + ".", "ok");
    }

    if (blocked) {
      log(
        "Algumas abas foram bloqueadas. Autorize pop-ups para spa.pge.mt.gov.br e rode novamente.",
        "error"
      );
    }

    return count;
  }

  async function openTabsAllPages(limit) {
    guardStart();
    try {
      limit = normalizeLimit(limit);
      logActionLimit(limit);
      logCustomFilters();
      setStatus("Abrindo pendencias e expedientes...");
      await setPageLength();
      await applyDateFilterIfNeeded();
      await goFirstPage();
      expandGroupsIfPresent();

      let total = 0;
      let pageNumber = 1;
      const processedProcessKeys = new Set();

      while (!state.stopped) {
        log("Fase abas, pagina " + pageNumber + ".");
        const remaining = limit ? Math.max(0, limit - total) : 0;
        const pageTotal = await openTabsCurrentPage(remaining, processedProcessKeys);
        total += pageTotal;

        if (limit && total >= limit) {
          log("Limite de abertura de abas atingido (" + limit + ").");
          break;
        }

        const next = await goNextPage();
        if (!next) break;
        pageNumber += 1;
      }

      log("Fase de abas concluida. Processos visitados: " + total + ".", "ok");
      setStatus("Abas concluidas: " + total);
    } catch (error) {
      log("Erro na fase de abas: " + error.message, "error");
      setStatus("Erro na fase de abas");
    } finally {
      state.running = false;
    }
  }

  function groupRows() {
    return Array.from(document.querySelectorAll("#procedures-box tbody tr.group-row")).filter(isVisible);
  }

  function groupCount(groupRow) {
    const badge = groupRow.querySelector(".badge");
    return normalizeLimit(badge ? badge.textContent : 0);
  }

  function groupLabel(groupRow) {
    const text = normalizeText(groupRow.textContent || "");
    return text || groupRow.getAttribute("data-group") || "grupo sem identificacao";
  }

  function groupProcessNumber(groupRow) {
    return (
      extractProcessNumber(groupLabel(groupRow)) ||
      extractProcessNumber(groupRow.getAttribute("data-group") || "")
    );
  }

  function isDuplicateProcessGroup(groupRow) {
    return normalizeText(groupLabel(groupRow)).toLowerCase().indexOf("numero do processo") >= 0;
  }

  function groupItems(groupRow) {
    const items = [];
    let current = groupRow.nextElementSibling;

    while (current && !current.classList.contains("group-row")) {
      if (current.classList.contains("group-item") && rowMatchesAllFilters(current)) {
        items.push(current);
      }
      current = current.nextElementSibling;
    }

    return items;
  }

  async function expandGroup(groupRow) {
    let items = groupItems(groupRow);
    if (!items.length || items.some(isVisible)) return items;

    groupRow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await sleep(700);
    await waitProcessingDone();

    items = groupItems(groupRow);
    if (items.some(isVisible)) return items;

    const icon = groupRow.querySelector(".toggle-icon");
    if (icon) {
      icon.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      await sleep(700);
      await waitProcessingDone();
    }

    items = groupItems(groupRow);
    if (!items.some(isVisible)) {
      items.forEach((row) => {
        row.style.display = "";
      });
      log("Grupo expandido por fallback visual: " + groupLabel(groupRow) + ".");
    }

    return items;
  }

  async function openDuplicateTabsCurrentPage(limit, processedProcessKeys) {
    const groups = groupRows().filter(
      (groupRow) => groupCount(groupRow) > 1 && isDuplicateProcessGroup(groupRow)
    );
    const seen = processedProcessKeys || new Set();
    let count = 0;
    let blocked = 0;

    log("Grupos duplicados visiveis na pagina: " + groups.length + ".");

    for (const groupRow of groups) {
      if (state.stopped) break;
      if (limit && count >= limit) break;

      const label = groupLabel(groupRow);
      const processKey = groupProcessNumber(groupRow) || label;
      if (seen.has(processKey)) continue;

      seen.add(processKey);
      const duplicateCount = groupCount(groupRow);
      log("Abrindo grupo duplicado (" + duplicateCount + "): " + label + ".");

      const items = (await expandGroup(groupRow)).filter(isVisible);
      if (!items.length) {
        log("Nenhum processo visivel dentro do grupo duplicado: " + label, "error");
        continue;
      }

      for (const row of items) {
        if (state.stopped) break;

        const result = await openTabsForRow(row);
        blocked += result.blocked;
      }

      count += 1;
      log("Processo duplicado contabilizado: " + processKey + ".", "ok");
    }

    if (blocked) {
      log(
        "Algumas abas foram bloqueadas. Autorize pop-ups para spa.pge.mt.gov.br e rode novamente.",
        "error"
      );
    }

    return count;
  }

  async function openDuplicateTabsAllPages(limit) {
    guardStart();
    try {
      limit = normalizeLimit(limit);
      logActionLimit(limit);
      logCustomFilters();
      setStatus("Abrindo duplicados...");
      await setPageLength();
      await applyDateFilterIfNeeded();
      await goFirstPage();

      let total = 0;
      let pageNumber = 1;
      const processedProcessKeys = new Set();

      while (!state.stopped) {
        log("Fase duplicados, pagina " + pageNumber + ".");
        const remaining = limit ? Math.max(0, limit - total) : 0;
        const pageTotal = await openDuplicateTabsCurrentPage(remaining, processedProcessKeys);
        total += pageTotal;

        if (limit && total >= limit) {
          log("Limite de abertura de duplicados atingido (" + limit + ").");
          break;
        }

        const next = await goNextPage();
        if (!next) break;
        pageNumber += 1;
      }

      log("Fase de duplicados concluida. Processos abertos: " + total + ".", "ok");
      setStatus("Duplicados abertos: " + total);
    } catch (error) {
      log("Erro na fase de duplicados: " + error.message, "error");
      setStatus("Erro nos duplicados");
    } finally {
      state.running = false;
    }
  }

  function guardStart() {
    if (state.running) throw new Error("Automacao ja esta em execucao.");
    state.running = true;
    state.stopped = false;
  }

  function stop() {
    state.stopped = true;
    state.running = false;
    setStatus("Fluxo encerrado");
    log("Parada solicitada pelo usuario.");
  }

  function createButton(text, onclick, variant) {
    const colors = {
      primary: "#1976d2",
      success: "#2e7d32",
      info: "#0277bd",
      warning: "#f57c00",
      danger: "#c62828",
      neutral: "#607d8b",
    };
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText =
      "border:0;padding:8px 9px;border-radius:5px;cursor:pointer;" +
      "font-size:12px;font-weight:700;line-height:1.15;background:" +
      (colors[variant || "primary"] || colors.primary) +
      ";color:white;min-height:34px;";
    button.addEventListener("click", onclick);
    return button;
  }

  function createPanelSection(title, startOpen) {
    const details = document.createElement("details");
    details.open = Boolean(startOpen);
    details.style.cssText =
      "background:#202a36;border:1px solid #344253;border-radius:7px;margin:7px 0;padding:7px;";

    const summary = document.createElement("summary");
    summary.textContent = title;
    summary.style.cssText =
      "cursor:pointer;font-weight:700;font-size:12px;color:#e3f2fd;outline:none;";

    const body = document.createElement("div");
    body.style.cssText = "margin-top:7px;";

    details.appendChild(summary);
    details.appendChild(body);
    return { section: details, body: body };
  }

  function createCheck(id, labelText, storageKey, defaultValue) {
    const label = document.createElement("label");
    label.style.cssText =
      "display:flex;align-items:center;gap:6px;margin:5px 0;color:#dce8f2;font-size:12px;";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.checked = storageGet(storageKey, defaultValue || "0") === "1";

    const span = document.createElement("span");
    span.textContent = labelText;

    input.addEventListener("change", () => {
      storageSet(storageKey, input.checked ? "1" : "0");
    });

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  function createPanel() {
    const old = document.querySelector("#spa-cdsp-panel");
    if (old) old.remove();

    const panel = document.createElement("div");
    panel.id = "spa-cdsp-panel";
    panel.style.cssText =
      "position:fixed;right:18px;bottom:18px;width:410px;z-index:999999;" +
      "background:#17212b;color:#fff;border-radius:8px;padding:12px;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:Arial,sans-serif;";

    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;";

    const title = document.createElement("div");
    title.textContent = "Automacao SPA CDSP";
    title.style.cssText = "font-weight:800;font-size:14px;flex:1;min-width:0;";

    const status = document.createElement("div");
    status.id = "spa-cdsp-status";
    status.textContent = "Pronto";
    status.style.cssText =
      "font-size:11px;color:#cfd8dc;background:#263544;border-radius:999px;padding:4px 8px;white-space:nowrap;";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.id = "spa-cdsp-panel-toggle";
    toggleButton.style.cssText =
      "border:1px solid #425466;background:#263544;color:#e3f2fd;border-radius:5px;" +
      "height:26px;min-width:58px;padding:0 7px;cursor:pointer;font-size:11px;font-weight:700;";

    const buttons = document.createElement("div");
    buttons.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;";
    buttons.appendChild(createButton("Dar ciencia", () => takeScienceAllPages(currentActionLimit()), "success"));
    buttons.appendChild(createButton("Atualizar lista", refreshProceduresTable, "primary"));
    buttons.appendChild(createButton("Abrir abas", () => openTabsAllPages(currentActionLimit()), "info"));
    buttons.appendChild(createButton("Abrir duplicados", () => openDuplicateTabsAllPages(currentActionLimit()), "warning"));
    buttons.appendChild(createButton("Encerrar marcados", () => closeMarkedAllPages(currentActionLimit()), "danger"));
    const stopButton = createButton("Encerrar Fluxo", stop, "neutral");
    stopButton.style.gridColumn = "1 / -1";
    buttons.appendChild(stopButton);

    const help = document.createElement("div");
    help.textContent =
      "Quantidade vazia ou 0 processa tudo. Depois das ciencias, use Atualizar lista. Se recarregar a aba com F5, injete este script novamente no Console.";
    help.style.cssText = "font-size:11px;color:#b0bec5;margin:8px 0;";

    const logBox = document.createElement("div");
    logBox.id = "spa-cdsp-log";
    logBox.style.cssText =
      "height:165px;overflow:auto;background:#0d131a;border-radius:6px;padding:7px;" +
      "font-family:Consolas,monospace;font-size:11px;line-height:1.35;";

    const content = document.createElement("div");
    content.id = "spa-cdsp-panel-content";

    function setPanelCollapsed(collapsed) {
      panel.dataset.collapsed = collapsed ? "1" : "0";
      content.style.display = collapsed ? "none" : "";
      status.style.display = collapsed ? "none" : "";
      toggleButton.textContent = collapsed ? "Abrir" : "Ocultar";
      toggleButton.title = collapsed ? "Abrir menu da automacao" : "Recolher menu da automacao";
      panel.style.width = collapsed ? "215px" : "410px";
      panel.style.padding = collapsed ? "8px 10px" : "12px";
      panel.style.cursor = collapsed ? "pointer" : "default";
      storageSet("SPA_CDSP_PANEL_COLLAPSED", collapsed ? "1" : "0");
    }

    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setPanelCollapsed(panel.dataset.collapsed !== "1");
    });

    header.addEventListener("click", () => {
      if (panel.dataset.collapsed === "1") setPanelCollapsed(false);
    });

    header.appendChild(title);
    header.appendChild(status);
    header.appendChild(toggleButton);
    panel.appendChild(header);
    content.appendChild(createDateControls());
    content.appendChild(createLimitControls());
    content.appendChild(createJurisdictionControls());
    content.appendChild(createDeadlineControls());
    content.appendChild(buttons);
    content.appendChild(help);
    content.appendChild(logBox);
    panel.appendChild(content);
    document.body.appendChild(panel);
    setPanelCollapsed(storageGet("SPA_CDSP_PANEL_COLLAPSED", "0") === "1");
  }

  window.SPA_CDSP_AUTOMACAO = {
    config: CONFIG,
    state: state,
    takeScienceAllPages: takeScienceAllPages,
    refreshProceduresTable: refreshProceduresTable,
    openTabsAllPages: openTabsAllPages,
    openDuplicateTabsAllPages: openDuplicateTabsAllPages,
    closeMarkedAllPages: closeMarkedAllPages,
    stop: stop,
    restoreDialogs: function () {
      window.confirm = originalConfirm;
      window.alert = originalAlert;
      log("confirm/alert restaurados.");
    },
  };

  function startPanelWhenReady() {
    if (!document.body) {
      setTimeout(startPanelWhenReady, 250);
      return;
    }

    createPanel();
    log("Painel carregado. Defina uma quantidade ou deixe 0/vazio para processar tudo.", "ok");
  }

  startPanelWhenReady();

  function createDateControls() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;align-items:center;gap:6px;margin:6px 0 8px 0;font-size:12px;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "spa-cdsp-use-date";
    checkbox.checked = storageGet("SPA_CDSP_DATE_ENABLED", CONFIG.dateFilter.enabled ? "1" : "0") === "1";

    const label = document.createElement("label");
    label.htmlFor = "spa-cdsp-use-date";
    label.textContent = "Filtrar data";
    label.style.cssText = "margin:0;color:#e3f2fd;";

    const input = document.createElement("input");
    input.id = "spa-cdsp-date";
    input.type = "date";
    input.value = storageGet("SPA_CDSP_DATE", CONFIG.dateFilter.date || "");
    input.style.cssText =
      "height:28px;border:0;border-radius:4px;padding:4px 6px;font-size:12px;flex:1;";

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    wrapper.appendChild(input);

    checkbox.addEventListener("change", () => {
      storageSet("SPA_CDSP_DATE_ENABLED", checkbox.checked ? "1" : "0");
    });
    input.addEventListener("change", () => {
      storageSet("SPA_CDSP_DATE", input.value || "");
    });

    return wrapper;
  }

  function createLimitControls() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;align-items:center;gap:6px;margin:6px 0 8px 0;font-size:12px;";

    const label = document.createElement("label");
    label.htmlFor = "spa-cdsp-limit";
    label.textContent = "Quantidade";
    label.style.cssText = "margin:0;color:#e3f2fd;min-width:72px;";

    const input = document.createElement("input");
    input.id = "spa-cdsp-limit";
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.placeholder = "0 = tudo";
    input.value = storageGet("SPA_CDSP_LIMIT", "");
    input.style.cssText =
      "height:28px;border:0;border-radius:4px;padding:4px 6px;font-size:12px;flex:1;";

    input.addEventListener("change", () => {
      const limit = normalizeLimit(input.value);
      input.value = limit ? String(limit) : "";
      storageSet("SPA_CDSP_LIMIT", input.value || "");
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }

  function createJurisdictionControls() {
    const hasSavedFilter =
      storageGet("SPA_CDSP_FILTER_TRIBUNAL_1", "0") === "1" ||
      storageGet("SPA_CDSP_FILTER_TRIBUNAL_2", "0") === "1" ||
      storageGet("SPA_CDSP_FILTER_CEJUSC", "0") === "1";
    const section = createPanelSection("Filtros de origem", hasSavedFilter);

    const hint = document.createElement("div");
    hint.textContent = "Aplica as acoes somente aos processos que baterem com os filtros marcados.";
    hint.style.cssText = "font-size:11px;color:#9fb3c8;margin-bottom:6px;";

    section.body.appendChild(hint);
    section.body.appendChild(createCheck("spa-cdsp-filter-tribunal-1", "Processos de 1o Grau", "SPA_CDSP_FILTER_TRIBUNAL_1"));
    section.body.appendChild(createCheck("spa-cdsp-filter-tribunal-2", "Processos de 2o Grau", "SPA_CDSP_FILTER_TRIBUNAL_2"));
    section.body.appendChild(createCheck("spa-cdsp-filter-cejusc", "Jurisdicao contem CEJUSC", "SPA_CDSP_FILTER_CEJUSC"));

    return section.section;
  }

  function createDeadlineControls() {
    const legacyDeadline = storageGet("SPA_CDSP_DEADLINE_FILTER", "");
    const hasSavedDeadline =
      Boolean(legacyDeadline) ||
      storageGet("SPA_CDSP_DEADLINE_LONG", "0") === "1" ||
      storageGet("SPA_CDSP_DEADLINE_SHORT", "0") === "1" ||
      storageGet("SPA_CDSP_DEADLINE_LATE", "0") === "1" ||
      storageGet("SPA_CDSP_DEADLINE_NONE", "0") === "1";
    const section = createPanelSection("Filtro de prazo", hasSavedDeadline);

    const hint = document.createElement("div");
    hint.textContent =
      "Marque uma ou mais opcoes. Sem nenhuma opcao marcada, todos os prazos entram no fluxo.";
    hint.style.cssText = "font-size:11px;color:#9fb3c8;margin-bottom:6px;";

    section.body.appendChild(hint);
    section.body.appendChild(
      createCheck(
        "spa-cdsp-deadline-long",
        "Azul - prazo longo",
        "SPA_CDSP_DEADLINE_LONG",
        legacyDeadline === "long" ? "1" : "0"
      )
    );
    section.body.appendChild(
      createCheck(
        "spa-cdsp-deadline-short",
        "Amarelo - prazo curto",
        "SPA_CDSP_DEADLINE_SHORT",
        legacyDeadline === "short" ? "1" : "0"
      )
    );
    section.body.appendChild(
      createCheck(
        "spa-cdsp-deadline-late",
        "Vermelho - atrasado",
        "SPA_CDSP_DEADLINE_LATE",
        legacyDeadline === "late" ? "1" : "0"
      )
    );
    section.body.appendChild(
      createCheck(
        "spa-cdsp-deadline-none",
        "Sem prazo",
        "SPA_CDSP_DEADLINE_NONE",
        legacyDeadline === "none" ? "1" : "0"
      )
    );

    const note = document.createElement("div");
    note.textContent =
      "O filtro usa a cor do prazo no SPA. Vermelho tambem considera prazo vencido quando houver data.";
    note.style.cssText = "font-size:11px;color:#9fb3c8;margin-top:6px;";
    section.body.appendChild(note);

    return section.section;
  }
})();
