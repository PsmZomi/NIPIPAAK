import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { PAWLPI_PROFIT_DOC, PAWLPI_STORES_COL } from "../utils/pawlpiSession";
import { newId, parseAmount } from "../utils/pawlpiHelpers";

function normalizeProfit(data) {
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  return entries.map((e) => ({
    id: e.id || newId(),
    year: Number(e.year) || 2023,
    title: String(e.title || "").trim(),
    amount: parseAmount(e.amount),
    published: Boolean(e.published),
    createdAt: e.createdAt || null,
    publishedAt: e.publishedAt || null,
  }));
}

export function usePawlpiProfit({ canEdit = false } = {}) {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    const ref = doc(db, PAWLPI_STORES_COL, PAWLPI_PROFIT_DOC);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        skipNextSave.current = true;
        setEntries(snap.exists() ? normalizeProfit(snap.data()) : []);
        setReady(true);
      },
      (err) => {
        console.warn(err);
        setReady(true);
        setSaveError(err?.message || "Could not load profit data");
      },
    );
    return () => unsub();
  }, []);

  const persist = useCallback(
    (nextEntries) => {
      if (!canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          setSaveError("");
          await setDoc(
            doc(db, PAWLPI_STORES_COL, PAWLPI_PROFIT_DOC),
            {
              entries: nextEntries,
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
    [canEdit],
  );

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    persist(entries);
  }, [entries, ready, persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const patchEntries = useCallback(
    (updater) => {
      if (!canEdit) return;
      setEntries((prev) => updater(prev));
    },
    [canEdit],
  );

  const addEntry = useCallback(
    ({ year, title, amount }) => {
      const y = Number(year);
      patchEntries((prev) => {
        if (prev.some((e) => Number(e.year) === y)) return prev;
        return [
          ...prev,
          {
            id: newId(),
            year: y,
            title: String(title || "").trim(),
            amount: parseAmount(amount),
            published: false,
            createdAt: null,
            publishedAt: null,
          },
        ];
      });
    },
    [patchEntries],
  );

  const updateEntry = useCallback(
    (id, patch) => {
      patchEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [patchEntries],
  );

  const publishEntry = useCallback(
    (id) => {
      patchEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, published: true, publishedAt: new Date().toISOString() }
            : e,
        ),
      );
    },
    [patchEntries],
  );

  const unpublishEntry = useCallback(
    (id) => {
      patchEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, published: false, publishedAt: null } : e,
        ),
      );
    },
    [patchEntries],
  );

  const deleteEntry = useCallback(
    (id) => {
      patchEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [patchEntries],
  );

  const publishedEntries = useMemo(
    () => entries.filter((e) => e.published),
    [entries],
  );

  const draftEntries = useMemo(
    () => entries.filter((e) => !e.published),
    [entries],
  );

  function yearProfitTotal(year, { publishedOnly = true } = {}) {
    const list = publishedOnly ? publishedEntries : entries;
    const match = list.find((e) => Number(e.year) === Number(year));
    return match ? parseAmount(match.amount) : 0;
  }

  function entryForYear(year) {
    return entries.find((e) => Number(e.year) === Number(year)) || null;
  }

  return {
    ready,
    entries,
    publishedEntries,
    draftEntries,
    saveError,
    addEntry,
    updateEntry,
    publishEntry,
    unpublishEntry,
    deleteEntry,
    yearProfitTotal,
    entryForYear,
  };
}
