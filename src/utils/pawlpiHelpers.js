export const MONTHS_FULL = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Collection: 2026 starts in April; other years Jan–Dec. */
export function monthsForCollection(year) {
  if (Number(year) === 2026) return MONTHS_FULL.slice(3);
  return [...MONTHS_FULL];
}

/** Opening capital column — first column in collection/loan tables. */
export const TABLE_CAPITAL = "Capital";
export const COLLECTION_CAPITAL = TABLE_CAPITAL;

/** Collection table columns: Capital at year start, then months. */
export function collectionColumns(year) {
  return [TABLE_CAPITAL, ...monthsForCollection(year)];
}

/** Loan: always Jan–Dec. */
export function monthsForLoan() {
  return [...MONTHS_FULL];
}

/** Loan table columns: Capital before Jan, then Jan–Dec. */
export function loanColumns(_year) {
  return [TABLE_CAPITAL, ...monthsForLoan()];
}

/** Columns that count toward the right-hand Total (excludes Capital). */
export function totalColumns(columns) {
  return columns.filter((col) => col !== TABLE_CAPITAL);
}

const PAWLPI_SUM_START_YEAR = 2022;
const PAWLPI_TABLE_START_YEAR = 2026;
const PAWLPI_PROFIT_START_YEAR = 2023;

/** Years in PAWLPI SUM / collection / loan picker (from 2022). */
export function tableYears() {
  const current = new Date().getFullYear();
  const end = Math.max(current, PAWLPI_TABLE_START_YEAR);
  const years = [];
  for (let y = PAWLPI_SUM_START_YEAR; y <= end + 1; y++) years.push(y);
  return years;
}

/**
 * Profit years: 2023 through last calendar year.
 * Current-year profit is entered the following year (e.g. 2026 profit in 2027).
 */
export function profitYears() {
  const lastProfitYear = new Date().getFullYear() - 1;
  if (lastProfitYear < PAWLPI_PROFIT_START_YEAR) return [];
  const years = [];
  for (let y = lastProfitYear; y >= PAWLPI_PROFIT_START_YEAR; y--) years.push(y);
  return years;
}

export function defaultTableYear() {
  return PAWLPI_TABLE_START_YEAR;
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyRow(months) {
  return {
    id: newId(),
    name: "",
    values: Object.fromEntries(months.map((m) => [m, ""])),
  };
}

function normalizeRow(row, columns) {
  const values = { ...(row.values || {}) };
  for (const col of columns) {
    if (!(col in values)) values[col] = "";
  }
  return {
    id: row.id || newId(),
    name: row.name ?? "",
    values,
  };
}

export function parseAmount(v) {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Indian grouping when > 9,999 (e.g. 10,000 → 1,00,000 → 12,34,567). */
export function formatIndianNumber(n) {
  const amount = parseAmount(n);
  if (!amount) return "0";
  if (amount <= 9999) {
    return Number.isInteger(amount)
      ? String(amount)
      : String(Math.round(amount * 100) / 100);
  }
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatCellAmount(v) {
  if (v == null || v === "") return "";
  return formatIndianNumber(v);
}

export function formatTotal(n) {
  return formatIndianNumber(n);
}

/** ₹ — commas only when value exceeds 9,999. */
export function formatRupee(n) {
  return `₹${formatIndianNumber(n)}`;
}

export function formatCurrency(n) {
  return formatIndianNumber(n);
}

export function defaultStore(getMonths) {
  const year = 2026;
  return {
    years: [2026, 2027],
    selectedYear: year,
    byYear: {
      2026: [emptyRow(getMonths(2026))],
      2027: [emptyRow(getMonths(2027))],
    },
  };
}

export function normalizeStore(data, getMonths) {
  if (!data || typeof data !== "object") return defaultStore(getMonths);
  const years =
    Array.isArray(data.years) && data.years.length
      ? data.years.map(Number)
      : [2026, 2027];
  const selectedYear = Number(data.selectedYear) || years[0];
  const byYear =
    data.byYear && typeof data.byYear === "object" ? data.byYear : {};
  for (const y of years) {
    const columns = getMonths(y);
    if (!Array.isArray(byYear[y]) || byYear[y].length === 0) {
      byYear[y] = [emptyRow(columns)];
    } else {
      byYear[y] = byYear[y].map((row) => normalizeRow(row, columns));
    }
  }
  return { years, selectedYear, byYear };
}

export function computeMonthTotals(rows, months) {
  const totals = {};
  for (const m of months) {
    totals[m] = rows.reduce(
      (sum, row) => sum + parseAmount(row.values?.[m]),
      0,
    );
  }
  return totals;
}

export function computeRowTotals(rows, months) {
  return rows.map((row) =>
    months.reduce((sum, m) => sum + parseAmount(row.values?.[m]), 0),
  );
}

export function computeYearTotal(rowTotals) {
  return rowTotals.reduce((sum, n) => sum + n, 0);
}
