import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { PAWLPI_STORES_COL } from "../utils/pawlpiSession";
import {
  computeMonthTotals,
  computeRowTotals,
  computeYearTotal,
  defaultStore,
  emptyRow,
  normalizeStore,
  totalColumns,
} from "../utils/pawlpiHelpers";

export function usePawlpiStore(
  storeDocId,
  getMonths,
  { canEdit = false, externalYear, excludeCapitalFromTotal = false } = {},
) {
  const [store, setStore] = useState(() => defaultStore(getMonths));
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);

  const year =
    externalYear != null ? Number(externalYear) : store.selectedYear;
  const months = useMemo(() => getMonths(year), [getMonths, year]);
  const rows = store.byYear[year] || [];

  const columnsForTotal = useMemo(() => {
    if (!excludeCapitalFromTotal) return months;
    return totalColumns(months);
  }, [excludeCapitalFromTotal, months]);

  const monthTotals = useMemo(
    () => computeMonthTotals(rows, months),
    [months, rows],
  );

  const rowTotals = useMemo(
    () => computeRowTotals(rows, columnsForTotal),
    [columnsForTotal, rows],
  );

  const yearTotal = useMemo(
    () => computeYearTotal(rowTotals),
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

  const patchStore = useCallback(
    (updater) => {
      if (!canEdit) return;
      setStore((prev) => updater(prev));
    },
    [canEdit],
  );

  const setYear = useCallback(
    (nextYear) => {
      const y = Number(nextYear);
      setStore((prev) => {
        const byYear = { ...prev.byYear };
        if (!byYear[y]) {
          byYear[y] = [emptyRow(getMonths(y))];
        }
        return { ...prev, selectedYear: y, byYear };
      });
    },
    [getMonths],
  );

  const addYear = useCallback(() => {
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
  }, [getMonths, patchStore]);

  const updateRow = useCallback(
    (rowId, patch) => {
      patchStore((prev) => {
        const list = (prev.byYear[year] || []).map((row) =>
          row.id === rowId ? { ...row, ...patch } : row,
        );
        return {
          ...prev,
          byYear: { ...prev.byYear, [year]: list },
        };
      });
    },
    [patchStore, year],
  );

  const updateCell = useCallback(
    (rowId, month, value) => {
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
    },
    [patchStore, year],
  );

  const addRow = useCallback(() => {
    patchStore((prev) => {
      const list = [...(prev.byYear[year] || []), emptyRow(months)];
      return {
        ...prev,
        byYear: { ...prev.byYear, [year]: list },
      };
    });
  }, [months, patchStore, year]);

  return {
    ready,
    store,
    setStore,
    saveError,
    year,
    months,
    rows,
    monthTotals,
    rowTotals,
    yearTotal,
    setYear,
    addYear,
    updateRow,
    updateCell,
    addRow,
    patchStore,
  };
}
