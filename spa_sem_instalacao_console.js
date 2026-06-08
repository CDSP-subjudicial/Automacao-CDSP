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
      columnNames: ["Data da Distribuicao", "Data da DistribuiÃ§Ã£o", "Recebido"],
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

  const HEALTH_LOGO_SRC =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAo4AAADACAMAAAC9HRLnAAADAFBMVEVMaXH///////////////////////////////////////////////////////8BAgULEiUCBAkKESI1V6oAAAEiOG4DBg4wT5ssSI4cL1w0VagJDx4KECELEiUlPXczVKUGCxYzU6QpRIYyUqEkO3QuS5QoQoIxUJ4OGC8QGzYTIUEmP30XJ00WJUoeMWEGChQ2WKwOGDAbLVkqRooZKVItSpEWJEgfM2UvTZcRHTogNWkZKlMNFiwsR5IVI0U1VqowTZ4zU6UuSZklPnowUJwrSI02WKwtRZMeMmQtS5QpPYodMF8jLHf////y8vItZqAgRoc2WKzt7u/x8fFASIg1V6vv7/Dk5OlHTozw8fEkMHw3baTf4OYjLHg0VaksNX1skrkrQZEyUKLq6+0lLnjW2OIzU6fn5+t/oMIwS50jLnoqPItSga8mM4EnNYLb4ujs7O4kLXcmL3lijLYlMn4qP47n6u0tRJQoOIfk5utahrIqM3vp6ewvSJo3P4MnN4QoOokzUqWNkrY8RIaanr7r7e/a4Oc1PYFLU496f6tZhbLq7O8xOn9SWZIxTZ9DSoouRpdFTIthZ5x2e6jb3eXZ2uMuNn2qrcefo8He3uaws8vi4+g5QYTP0d3U1eDNztw9cqfIytlOVZBvdaSEiLCVmbtrkrng4edVW5WGi7I+RocoMXrR099eZJp9g62coL9yd6a+wNMwaKFobqC2x9mAha+zts1JUI26vdHDx9eet8+RlbgvOH6ipsNscqOlqMTBw9V2mb5qcKG4u88nTIuuwtWnvNNaYZi3uc6nqsbGyNeJjrRYXpatsMm9zNywvNFkap0pMnrq7O6zxdhuhq/O2OPf5OqJp8aYm7xNa55FZZrL09+5w9WercfY3uYsUI3d4edch7MsZJ5mbJ46W5RTb6CFmbokSYkzVZF/lLd5j7SkutE+X5ZXhLFoj7iSrspge6ils8uGpcWTpMGtus9ulLtWcqKas82Nn79bdqV7nsCYqMROfa6CosNukbg5TYyuOFs7AAAATHRSTlMAIjPddxFmRLvuzKpViJkFOAsl/AGhEeTRh/kgKjGv9hvyxe6p2b3pNkxctm9qjBj+RIDLddVnkd1TmXo95GN5+vv2WHJlf/JHa/ldaTqR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";

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
    const normalized = normalizeText(text).toLowerCase().replace(/[ÂºÂ°]/g, "");
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

  function keepCurrentTabFocused() {
    [30, 120, 300, 700, 1200, 1800].forEach((delay) => {
      setTimeout(() => {
        try {
          window.focus();
          const panel = document.querySelector("#spa-cdsp-panel");
          if (panel) panel.focus({ preventScroll: true });
        } catch (_error) {
          // O navegador pode ignorar foco programatico; o Ctrl+clique e a tentativa principal.
        }
      }, delay);
    });
  }

  function middleClickElement(element) {
    if (!element) return false;

    if (element.scrollIntoView) {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }

    const downOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 1,
      buttons: 4,
    };
    const clickOptions = Object.assign({}, downOptions, { buttons: 0 });

    element.dispatchEvent(new MouseEvent("mousedown", downOptions));
    element.dispatchEvent(new MouseEvent("mouseup", clickOptions));
    element.dispatchEvent(new MouseEvent("auxclick", clickOptions));
    keepCurrentTabFocused();
    return true;
  }

  function openElementInBackground(element) {
    if (!element) return false;

    const tag = String(element.tagName || "").toLowerCase();
    const link = tag === "a" ? element : element.closest("a[href]");

    if (link) {
      try {
        middleClickElement(link);
        return true;
      } catch (_error) {
        return ctrlClickElement(link);
      }
    }

    return ctrlClickElement(element);
  }

  function ctrlClickElement(element) {
    if (!element) return false;

    if (element.scrollIntoView) {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }

    const downOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      ctrlKey: true,
      button: 0,
      buttons: 1,
    };
    const clickOptions = Object.assign({}, downOptions, { buttons: 0 });

    element.dispatchEvent(new MouseEvent("mousedown", downOptions));
    element.dispatchEvent(new MouseEvent("mouseup", clickOptions));
    element.dispatchEvent(new MouseEvent("click", clickOptions));
    keepCurrentTabFocused();
    return true;
  }

  function ctrlClickUrl(url) {
    if (!url || !document.body) return false;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;";
    document.body.appendChild(link);

    try {
      return ctrlClickElement(link);
    } finally {
      link.remove();
    }
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

    const cell = row.querySelector("td.cursor-pointer");
    const procedureUrl = getProcedureUrl(row);
    if (cell) {
      openElementInBackground(cell);
      log("Pendencia acionada por Ctrl+clique: " + label, "ok");
    } else if (procedureUrl) {
      ctrlClickUrl(procedureUrl);
      log("Pendencia acionada por Ctrl+clique via URL: " + label, "ok");
    } else {
      log("Pendencia nao encontrada: " + label, "error");
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

      openElementInBackground(expediente);
      log(title + " acionado para abrir em segundo plano.", "ok");

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
      info:    "#0277bd",
      warning: "#f57c00",
      danger:  "#c62828",
      neutral: "#607d8b",
      teal:    "#0f6e56",
      blue:    "#185fa5",
      purple:  "#4527a0",
      amber:   "#e65100",
      red:     "#7a1a1a",
      gray:    "#2a4560",
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
      updateActiveFiltersSummary();
    });

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  function setStoredCheckbox(selector, storageKey, checked) {
    const input = document.querySelector(selector);
    if (input) input.checked = Boolean(checked);
    storageSet(storageKey, checked ? "1" : "0");
  }

  function clearSourceFilters(silent) {
    setStoredCheckbox("#spa-cdsp-filter-tribunal-1", "SPA_CDSP_FILTER_TRIBUNAL_1", false);
    setStoredCheckbox("#spa-cdsp-filter-tribunal-2", "SPA_CDSP_FILTER_TRIBUNAL_2", false);
    setStoredCheckbox("#spa-cdsp-filter-cejusc", "SPA_CDSP_FILTER_CEJUSC", false);
    updateActiveFiltersSummary();
    if (!silent) log("Filtros de origem limpos.");
  }

  function clearDeadlineFilters(silent) {
    setStoredCheckbox("#spa-cdsp-deadline-long", "SPA_CDSP_DEADLINE_LONG", false);
    setStoredCheckbox("#spa-cdsp-deadline-short", "SPA_CDSP_DEADLINE_SHORT", false);
    setStoredCheckbox("#spa-cdsp-deadline-late", "SPA_CDSP_DEADLINE_LATE", false);
    setStoredCheckbox("#spa-cdsp-deadline-none", "SPA_CDSP_DEADLINE_NONE", false);
    storageSet("SPA_CDSP_DEADLINE_FILTER", "");
    updateActiveFiltersSummary();
    if (!silent) log("Filtros de prazo limpos.");
  }

  function clearAllCustomFilters() {
    clearSourceFilters(true);
    clearDeadlineFilters(true);
    updateActiveFiltersSummary();
    log("Todos os filtros condicionais foram limpos.");
  }

  function updateActiveFiltersSummary() {
    const label = document.querySelector("#spa-cdsp-active-filters-label");
    if (!label) return;

    const labels = activeFilterLabels(currentCustomFilters());
    if (labels.length) {
      label.textContent = "Filtros ativos: " + labels.join("; ");
      label.style.color = "#ffe082";
    } else {
      label.textContent = "Filtros ativos: nenhum";
      label.style.color = "#b0bec5";
    }
  }

  function createSmallUtilityButton(text, onclick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.style.cssText =
      "border:1px solid #425466;background:#263544;color:#e3f2fd;border-radius:4px;" +
      "padding:4px 6px;cursor:pointer;font-size:11px;font-weight:700;";
    button.addEventListener("click", onclick);
    return button;
  }

  function createActiveFiltersSummary() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "background:#101820;border:1px solid #344253;border-radius:6px;margin:7px 0;padding:7px;";

    const label = document.createElement("div");
    label.id = "spa-cdsp-active-filters-label";
    label.style.cssText = "font-size:11px;line-height:1.35;margin-bottom:6px;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:5px;flex-wrap:wrap;";
    actions.appendChild(createSmallUtilityButton("Limpar origem", clearSourceFilters));
    actions.appendChild(createSmallUtilityButton("Limpar prazo", clearDeadlineFilters));
    actions.appendChild(createSmallUtilityButton("Limpar tudo", clearAllCustomFilters));

    wrapper.appendChild(label);
    wrapper.appendChild(actions);
    return wrapper;
  }

  function createHealthLogo() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;align-items:center;justify-content:center;margin:7px 0 8px 0;" +
      "padding:6px;border-radius:6px;background:#4f6b73;";

    const image = document.createElement("img");
    image.src = HEALTH_LOGO_SRC;
    image.alt = "Coordenadoria de Defesa da Saude Publica";
    image.style.cssText =
      "display:block;width:100%;height:auto;max-height:64px;object-fit:contain;";

    wrapper.appendChild(image);
    return wrapper;
  }

  function createPanel() {
    const old = document.querySelector("#spa-cdsp-panel");
    if (old) old.remove();

    const panel = document.createElement("div");
    panel.id = "spa-cdsp-panel";
    panel.tabIndex = -1;
    panel.style.cssText =
      "position:fixed;right:18px;bottom:18px;width:410px;z-index:999999;" +
      "background:#17212b;color:#fff;border-radius:8px;padding:12px;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:Arial,sans-serif;";

    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;";

    const title = document.createElement("div");
    title.textContent = "teste cdsp";
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
    buttons.appendChild(createButton("Dar Ciência",        () => takeScienceAllPages(currentActionLimit()),       "teal"));
    buttons.appendChild(createButton("Atualizar Lista",    refreshProceduresTable,                                "blue"));
    buttons.appendChild(createButton("Abrir Abas",         () => openTabsAllPages(currentActionLimit()),          "purple"));
    buttons.appendChild(createButton("Abrir Duplicados",   () => openDuplicateTabsAllPages(currentActionLimit()), "amber"));
    const encerrarMarcados = createButton("Encerrar Marcados", () => closeMarkedAllPages(currentActionLimit()), "red");
    encerrarMarcados.style.gridColumn = "1 / -1";
    buttons.appendChild(encerrarMarcados);
    const stopButton = createButton("Encerrar Fluxo", stop, "gray");
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
    content.appendChild(createHealthLogo());
    content.appendChild(createDateControls());
    content.appendChild(createLimitControls());
    content.appendChild(createActiveFiltersSummary());
    content.appendChild(createJurisdictionControls());
    content.appendChild(createDeadlineControls());
    content.appendChild(buttons);
    content.appendChild(help);
    content.appendChild(logBox);
    panel.appendChild(content);
    document.body.appendChild(panel);
    setPanelCollapsed(storageGet("SPA_CDSP_PANEL_COLLAPSED", "0") === "1");
    updateActiveFiltersSummary();
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
