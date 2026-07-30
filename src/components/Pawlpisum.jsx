import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  PAWLPI_COLLECTION_DOC,
  PAWLPI_LOAN_DOC,
  PAWLPI_STORES_COL,
} from "../utils/pawlpiSession";

const MONTHS_FULL = [
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

/** Shared widths so header labels line up with body cells */
const NAME_COL = "shrink-0 w-[6.5rem] sm:w-[11rem]";
const MONTH_COL = "w-11 sm:w-[4.5rem] shrink-0";
const TOTAL_COL = "w-12 sm:w-[4.5rem] shrink-0";

/** Collection: 2026 starts in April; other years Jan–Dec. */
export function monthsForCollection(year) {
  if (Number(year) === 2026) return MONTHS_FULL.slice(3);
  return [...MONTHS_FULL];
}

/** Loan: always Jan–Dec. */
export function monthsForLoan() {
  return [...MONTHS_FULL];
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyRow(months) {
  return {
    id: newId(),
    name: "",
    values: Object.fromEntries(months.map((m) => [m, ""])),
  };
}

function parseAmount(v) {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatTotal(n) {
  if (!n) return "0";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function defaultStore(getMonths) {
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

function normalizeStore(data, getMonths) {
  if (!data || typeof data !== "object") return defaultStore(getMonths);
  const years =
    Array.isArray(data.years) && data.years.length
      ? data.years.map(Number)
      : [2026, 2027];
  const selectedYear = Number(data.selectedYear) || years[0];
  const byYear =
    data.byYear && typeof data.byYear === "object" ? data.byYear : {};
  for (const y of years) {
    if (!Array.isArray(byYear[y]) || byYear[y].length === 0) {
      byYear[y] = [emptyRow(getMonths(y))];
    }
  }
  return { years, selectedYear, byYear };
}

function YearTableSection({
  caption,
  storeDocId,
  getMonths,
  monthRangeLabel,
  canEdit,
  hideCaption = false,
  /** Mobile: one sticky stack for chrome + year + Name/month headers */
  unifiedSticky = false,
  stickySection = null,
  stickyRoleLabel = null,
}) {
  const [store, setStore] = useState(() => defaultStore(getMonths));
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);

  const year = store.selectedYear;
  const months = useMemo(() => getMonths(year), [getMonths, year]);
  const rows = store.byYear[year] || [];

  const monthTotals = useMemo(() => {
    const totals = {};
    for (const m of months) {
      totals[m] = rows.reduce(
        (sum, row) => sum + parseAmount(row.values?.[m]),
        0,
      );
    }
    return totals;
  }, [months, rows]);

  const rowTotals = useMemo(
    () =>
      rows.map((row) =>
        months.reduce((sum, m) => sum + parseAmount(row.values?.[m]), 0),
      ),
    [months, rows],
  );

  const yearTotal = useMemo(
    () => rowTotals.reduce((sum, n) => sum + n, 0),
    [rowTotals],
  );

  useEffect(() => {
    const ref = doc(db, PAWLPI_STORES_COL, storeDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        skipNextSave.current = true;
        if (snap.exists()) {
          setStore(normalizeStore(snap.data(), getMonths));
        } else {
          setStore(defaultStore(getMonths));
        }
        setReady(true);
      },
      (err) => {
        console.warn(err);
        setReady(true);
        setSaveError(err?.message || "Could not load data");
      },
    );
    return () => unsub();
  }, [storeDocId, getMonths]);

  const persist = useCallback(
    (next) => {
      if (!canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          setSaveError("");
          await setDoc(
            doc(db, PAWLPI_STORES_COL, storeDocId),
            {
              years: next.years,
              selectedYear: next.selectedYear,
              byYear: next.byYear,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch (err) {
          console.warn(err);
          setSaveError(err?.message || "Save failed (editor only)");
        }
      }, 450);
    },
    [canEdit, storeDocId],
  );

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    persist(store);
  }, [store, ready, persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function patchStore(updater) {
    if (!canEdit) return;
    setStore((prev) => updater(prev));
  }

  function setYear(nextYear) {
    const y = Number(nextYear);
    setStore((prev) => {
      const byYear = { ...prev.byYear };
      if (!byYear[y]) {
        byYear[y] = [emptyRow(getMonths(y))];
      }
      return { ...prev, selectedYear: y, byYear };
    });
  }

  function addYear() {
    patchStore((prev) => {
      const next = Math.max(...prev.years) + 1;
      return {
        ...prev,
        years: [...prev.years, next],
        selectedYear: next,
        byYear: {
          ...prev.byYear,
          [next]: [emptyRow(getMonths(next))],
        },
      };
    });
  }

  function updateRow(rowId, patch) {
    patchStore((prev) => {
      const list = (prev.byYear[year] || []).map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      );
      return {
        ...prev,
        byYear: { ...prev.byYear, [year]: list },
      };
    });
  }

  function updateCell(rowId, month, value) {
    patchStore((prev) => {
      const list = (prev.byYear[year] || []).map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          values: { ...row.values, [month]: value },
        };
      });
      return {
        ...prev,
        byYear: { ...prev.byYear, [year]: list },
      };
    });
  }

  function addRow() {
    patchStore((prev) => {
      const list = [...(prev.byYear[year] || []), emptyRow(months)];
      return {
        ...prev,
        byYear: { ...prev.byYear, [year]: list },
      };
    });
  }

  const inputClass = canEdit
    ? "border-transparent hover:border-zinc-200 focus:border-green-400 focus:bg-white"
    : "border-transparent bg-transparent cursor-default text-ink";

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const syncing = useRef(false);

  function syncScroll(from, to) {
    if (syncing.current || !from || !to) return;
    syncing.current = true;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }

  const yearSelect = (
    <div className="flex items-center gap-1 min-w-0">
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        aria-label="Year"
        className="min-w-0 flex-1 bg-transparent border-0 rounded-lg px-2 py-2 text-sm font-semibold text-ink outline-none focus:outline-none focus:ring-0 shadow-none"
      >
        {store.years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {canEdit ? (
        <button
          type="button"
          onClick={addYear}
          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border-0 bg-transparent text-lg font-bold text-ink"
          aria-label="Add next year"
          title="Add next year"
        >
          +
        </button>
      ) : null}
    </div>
  );

  const yearControlsDesktop = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {!hideCaption ? (
        <p className="w-full text-center font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted mb-1">
          {caption}
        </p>
      ) : null}
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
        Year
        {yearSelect}
      </label>
    </div>
  );

  const monthsAndTotalHeader = (
    <div className="min-w-max h-9 sm:h-12 flex items-stretch">
      {months.map((m) => (
        <div
          key={m}
          className={`${MONTH_COL} flex items-center justify-center text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted`}
        >
          {m}
        </div>
      ))}
      <div
        className={`${TOTAL_COL} flex items-center justify-center text-[9px] sm:text-xs font-bold uppercase tracking-widest text-ink`}
      >
        Total
      </div>
    </div>
  );

  const nameMonthHeader = ready ? (
    <div className="flex bg-zinc-50 border-t border-zinc-200 -mx-1 sm:mx-0">
      <div
        className={`${NAME_COL} flex items-center justify-start px-0.5 sm:px-3 h-9 sm:h-12 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted bg-zinc-50 shadow-[6px_0_12px_-8px_rgba(0,0,0,0.18)] z-30`}
      >
        Name
      </div>
      <div
        ref={headerScrollRef}
        onScroll={() =>
          syncScroll(headerScrollRef.current, bodyScrollRef.current)
        }
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {monthsAndTotalHeader}
      </div>
    </div>
  ) : null;

  return (
    <section className="w-full">
      {unifiedSticky ? (
        <div className="sticky top-[105px] sm:top-[105px] z-40 bg-zinc-50 backdrop-blur-md -mx-1 px-1 border-b border-zinc-200 shadow-sm">
          {stickyRoleLabel ? (
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted pt-2 pb-1">
              {stickyRoleLabel}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 items-center px-0.5 py-1.5">
            {stickySection}
            {yearSelect}
          </div>
          {nameMonthHeader}
        </div>
      ) : (
        <div className="mb-3 lg:mb-6">{yearControlsDesktop}</div>
      )}

      {!ready ? (
        <p className="text-center font-mono text-[10px] text-muted py-8">
          Loading table…
        </p>
      ) : (
        <>
          {/* Desktop: sticky header outside overflow clip so it stays under site nav */}
          {!unifiedSticky ? (
            <div className="sticky top-[110px] z-30 flex bg-zinc-50 border border-zinc-200 border-b-0 rounded-t-xl shadow-sm">
              <div
                className={`${NAME_COL} flex items-center justify-start px-3 h-12 text-xs font-bold uppercase tracking-widest text-muted bg-zinc-50 shadow-[6px_0_12px_-8px_rgba(0,0,0,0.18)] z-30`}
              >
                Name
              </div>
              <div
                ref={headerScrollRef}
                onScroll={() =>
                  syncScroll(headerScrollRef.current, bodyScrollRef.current)
                }
                className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {monthsAndTotalHeader}
              </div>
            </div>
          ) : null}

          <div
            className={`rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden -mx-1 sm:mx-0 ${
              unifiedSticky
                ? "rounded-t-none border-t-0"
                : "rounded-t-none border-t-0 sm:mx-0"
            }`}
          >
            <div className="flex">
              <div
                className={`${NAME_COL} bg-white z-10 shadow-[6px_0_12px_-8px_rgba(0,0,0,0.18)]`}
              >
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="h-9 sm:h-12 flex items-center justify-start px-0.5 sm:px-2 border-b border-zinc-100"
                  >
                    <input
                      type="text"
                      value={row.name}
                      readOnly={!canEdit}
                      onChange={(e) =>
                        updateRow(row.id, { name: e.target.value })
                      }
                      placeholder={canEdit ? "Name" : "—"}
                      className={`w-full min-w-0 h-full px-0.5 sm:px-1.5 text-xs sm:text-sm text-left border rounded-md outline-none ${inputClass}`}
                    />
                  </div>
                ))}
                <div className="h-9 sm:h-12 flex items-center justify-start px-0.5 sm:px-2 bg-zinc-50 border-t border-zinc-200">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-ink px-0.5">
                    Total
                  </span>
                </div>
              </div>

              <div
                ref={bodyScrollRef}
                onScroll={() =>
                  syncScroll(bodyScrollRef.current, headerScrollRef.current)
                }
                className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                }}
              >
                <div className="min-w-max">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="h-9 sm:h-12 flex items-stretch border-b border-zinc-100"
                    >
                      {months.map((m) => (
                        <div
                          key={m}
                          className={`${MONTH_COL} flex items-center px-0.5 sm:px-1`}
                        >
                          <input
                            type="text"
                            value={row.values?.[m] ?? ""}
                            readOnly={!canEdit}
                            onChange={(e) =>
                              updateCell(row.id, m, e.target.value)
                            }
                            className={`w-full h-full px-0 sm:px-1 text-xs sm:text-sm text-center border rounded-md outline-none ${inputClass}`}
                          />
                        </div>
                      ))}
                      <div
                        className={`${TOTAL_COL} flex items-center justify-center px-0.5 bg-zinc-50/80`}
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-ink tabular-nums">
                          {formatTotal(rowTotals[i])}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="h-9 sm:h-12 flex items-stretch bg-zinc-50 border-t border-zinc-200">
                    {months.map((m) => (
                      <div
                        key={m}
                        className={`${MONTH_COL} flex items-center justify-center px-0.5`}
                      >
                        <span className="text-[10px] sm:text-xs font-bold text-ink tabular-nums">
                          {formatTotal(monthTotals[m])}
                        </span>
                      </div>
                    ))}
                    <div
                      className={`${TOTAL_COL} flex items-center justify-center px-0.5`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-ink tabular-nums">
                        {formatTotal(yearTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canEdit ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 bg-white text-xs font-bold uppercase tracking-widest text-ink hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                Add row
              </button>
            </div>
          ) : null}

          {saveError ? (
            <p className="mt-3 text-center text-xs text-red-600">{saveError}</p>
          ) : null}
        </>
      )}
    </section>
  );
}

const SECTIONS = [
  {
    id: "collection",
    caption: "Pawlpi Collection",
    storeDocId: PAWLPI_COLLECTION_DOC,
    getMonths: monthsForCollection,
    monthRangeLabel: (y) => (y === 2026 ? "Apr–Dec" : "Jan–Dec"),
  },
  {
    id: "loan",
    caption: "Pawlpi Loan",
    storeDocId: PAWLPI_LOAN_DOC,
    getMonths: monthsForLoan,
    monthRangeLabel: () => "Jan–Dec",
  },
];

export default function Pawlpisum({ canEdit = false, role = null }) {
  const [mobileSection, setMobileSection] = useState("collection");
  const roleLabel = role ? (canEdit ? "Editor" : "Member") : null;

  const mobileSectionSelect = (
    <select
      value={mobileSection}
      onChange={(e) => setMobileSection(e.target.value)}
      aria-label="Section"
      className="w-full min-w-0 bg-transparent border-0 rounded-lg px-2 py-2 text-sm font-semibold text-ink outline-none focus:outline-none focus:ring-0 shadow-none"
    >
      {SECTIONS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.caption.replace(/^Pawlpi\s+/i, "")}
        </option>
      ))}
    </select>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-2 lg:space-y-20">
      {roleLabel ? (
        <p className="hidden lg:block text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-4">
          {roleLabel}
        </p>
      ) : null}

      <div className="lg:hidden">
        {SECTIONS.filter((s) => s.id === mobileSection).map((s) => (
          <YearTableSection
            key={s.id}
            caption={s.caption}
            storeDocId={s.storeDocId}
            getMonths={s.getMonths}
            monthRangeLabel={s.monthRangeLabel}
            canEdit={canEdit}
            hideCaption
            unifiedSticky
            stickyRoleLabel={roleLabel}
            stickySection={mobileSectionSelect}
          />
        ))}
      </div>

      <div className="hidden lg:block space-y-20">
        {SECTIONS.map((s) => (
          <YearTableSection
            key={s.id}
            caption={s.caption}
            storeDocId={s.storeDocId}
            getMonths={s.getMonths}
            monthRangeLabel={s.monthRangeLabel}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}
