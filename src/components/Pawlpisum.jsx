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
  const years = Array.isArray(data.years) && data.years.length
    ? data.years.map(Number)
    : [2026, 2027];
  const selectedYear = Number(data.selectedYear) || years[0];
  const byYear = data.byYear && typeof data.byYear === "object" ? data.byYear : {};
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
}) {
  const [store, setStore] = useState(() => defaultStore(getMonths));
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);

  const year = store.selectedYear;
  const months = useMemo(() => getMonths(year), [getMonths, year]);
  const rows = store.byYear[year] || [];

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

  function removeRow(rowId) {
    patchStore((prev) => {
      const list = (prev.byYear[year] || []).filter((r) => r.id !== rowId);
      return {
        ...prev,
        byYear: {
          ...prev.byYear,
          [year]: list.length ? list : [emptyRow(months)],
        },
      };
    });
  }

  const inputClass = canEdit
    ? "border-transparent hover:border-zinc-200 focus:border-green-400 focus:bg-white"
    : "border-transparent bg-transparent cursor-default text-ink";

  return (
    <section className="w-full">
      <p className="text-center font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted mb-5 lg:mb-6">
        {caption}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-5 lg:mb-6">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
          Year
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-green-500"
          >
            {store.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {canEdit ? (
          <button
            type="button"
            onClick={addYear}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-zinc-200 bg-white text-lg font-bold text-ink hover:border-green-400 hover:text-green-600 transition-colors"
            aria-label="Add next year"
            title="Add next year"
          >
            +
          </button>
        ) : null}
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
          {monthRangeLabel(year, months)} · {months.length} months
        </span>
      </div>

      {!ready ? (
        <p className="text-center font-mono text-[10px] text-muted py-8">
          Loading table…
        </p>
      ) : (
        <>
          <div className="flex rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden -mx-1 sm:mx-0">
            <div className="shrink-0 w-[7.25rem] sm:w-[10rem] border-r border-zinc-200 bg-white z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]">
              <div className="h-11 flex items-center px-2 sm:px-3 bg-zinc-50 border-b border-zinc-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted">
                Name
              </div>
              {rows.map((row, i) => (
                <div
                  key={row.id}
                  className={`h-12 flex items-center px-1.5 sm:px-2 ${
                    i < rows.length - 1 ? "border-b border-zinc-100" : ""
                  }`}
                >
                  <input
                    type="text"
                    value={row.name}
                    readOnly={!canEdit}
                    onChange={(e) =>
                      updateRow(row.id, { name: e.target.value })
                    }
                    placeholder={canEdit ? "Name" : "—"}
                    className={`w-full px-1.5 py-1.5 text-sm border rounded-md outline-none ${inputClass}`}
                  />
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x">
              <div
                className="min-w-max"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="h-11 flex items-stretch bg-zinc-50 border-b border-zinc-200">
                  {months.map((m) => (
                    <div
                      key={m}
                      className="w-16 sm:w-[4.5rem] shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted"
                    >
                      {m}
                    </div>
                  ))}
                  {canEdit ? <div className="w-10 shrink-0" aria-hidden /> : null}
                </div>
                {rows.map((row, i) => (
                  <div
                    key={row.id}
                    className={`h-12 flex items-stretch ${
                      i < rows.length - 1 ? "border-b border-zinc-100" : ""
                    }`}
                  >
                    {months.map((m) => (
                      <div
                        key={m}
                        className="w-16 sm:w-[4.5rem] shrink-0 flex items-center px-0.5"
                      >
                        <input
                          type="text"
                          value={row.values?.[m] ?? ""}
                          readOnly={!canEdit}
                          onChange={(e) =>
                            updateCell(row.id, m, e.target.value)
                          }
                          className={`w-full px-1 py-1.5 text-sm text-center border rounded-md outline-none ${inputClass}`}
                        />
                      </div>
                    ))}
                    {canEdit ? (
                      <div className="w-10 shrink-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="h-8 w-8 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors text-lg leading-none"
                          aria-label="Remove row"
                          title="Remove row"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
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

export default function Pawlpisum({ canEdit = false, role = null }) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-14 lg:space-y-20">
      <header className="text-center pt-2">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pawlpi
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {canEdit ? "Editor" : "View only"}
          {role ? ` · ${role}` : ""}
        </p>
      </header>

      <YearTableSection
        caption="Pawlpi Collection"
        storeDocId={PAWLPI_COLLECTION_DOC}
        getMonths={monthsForCollection}
        monthRangeLabel={(y) => (y === 2026 ? "Apr–Dec" : "Jan–Dec")}
        canEdit={canEdit}
      />

      <YearTableSection
        caption="Pawlpi Loan"
        storeDocId={PAWLPI_LOAN_DOC}
        getMonths={monthsForLoan}
        monthRangeLabel={() => "Jan–Dec"}
        canEdit={canEdit}
      />
    </div>
  );
}
