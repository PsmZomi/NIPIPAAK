import { useMemo, useState } from "react";
import { usePawlpiProfit } from "../hooks/usePawlpiProfit";
import PawlpiProfitChart from "./PawlpiProfitChart";
import PawlpiSelect from "./PawlpiSelect";
import { formatTotal, profitYears } from "../utils/pawlpiHelpers";

export default function PawlpiProfit({ canEdit = false, years }) {
  const availableYears = years ?? profitYears();
  const {
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
  } = usePawlpiProfit({ canEdit });

  const [formYear, setFormYear] = useState(() => availableYears[0] ?? 2023);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const yearsWithoutEntry = useMemo(
    () => availableYears.filter((y) => !entries.some((e) => Number(e.year) === y)),
    [availableYears, entries],
  );

  const visibleEntries = useMemo(() => {
    const list = canEdit
      ? [...draftEntries, ...publishedEntries]
      : publishedEntries;
    return list
      .filter((e) => availableYears.includes(Number(e.year)))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [canEdit, draftEntries, publishedEntries, availableYears]);

  function handleAdd(e) {
    e.preventDefault();
    if (!canEdit || !title.trim() || !amount.trim() || !formYear) return;
    addEntry({ year: formYear, title: title.trim(), amount });
    setTitle("");
    setAmount("");
    const next = yearsWithoutEntry.filter((y) => y !== formYear);
    if (next.length) setFormYear(next[0]);
  }

  function startEdit(entry) {
    setEditId(entry.id);
    setEditTitle(entry.title || "");
    setEditAmount(String(entry.amount || ""));
  }

  function saveEdit(id) {
    updateEntry(id, { title: editTitle.trim(), amount: editAmount });
    setEditId(null);
    setEditTitle("");
    setEditAmount("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditTitle("");
    setEditAmount("");
  }

  if (availableYears.length === 0) {
    return (
      <section className="w-full mb-4 lg:mb-6 pt-4">
        <h2
          className="text-xl sm:text-2xl font-bold text-ink mb-"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pawlpi Business Profit
        </h2>
      </section>
    );
  }

  return (
    <section className="w-full mb-8 lg:mb-12">
      <div className="mb-2 pt-4 text-center sm:text-left">
        <h2
          className="text-xl sm:text-2xl font-bold text-ink"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pawlpi Business Profit
        </h2>
      </div>

      {!ready ? (
        <p className="text-center font-mono text-[10px] text-muted py-6">
          Loading profit…
        </p>
      ) : (
        <>
          {canEdit && yearsWithoutEntry.length > 0 ? (
            <form
              onSubmit={handleAdd}
              className="mb-5 p-4 sm:p-5 rounded-xl bg-paper border border-zinc-200"
            >
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Add profit
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                <PawlpiSelect
                  value={formYear}
                  onChange={(y) => setFormYear(Number(y))}
                  ariaLabel="Profit year"
                  options={yearsWithoutEntry.map((y) => ({
                    value: y,
                    label: String(y),
                  }))}
                />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Description"
                  className="bg-paper border border-zinc-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Yearly amount"
                  className="bg-paper border border-zinc-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-ink text-white font-bold py-2.5 rounded-lg text-[10px] sm:text-xs uppercase tracking-widest transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          ) : null}

          <div className="rounded-xl border border-zinc-200 bg-paper overflow-hidden">
            <div
              className={`grid gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-paper text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted grid-cols-[2.75rem_1fr_4.5rem] ${
                canEdit ? "sm:grid-cols-[4rem_1fr_6rem_auto]" : "sm:grid-cols-[4rem_1fr_6rem]"
              }`}
            >
              <span>Year</span>
              <span>Description</span>
              <span className="text-right sm:text-left">Profit</span>
              {canEdit ? <span className="hidden sm:block text-right">Actions</span> : null}
            </div>

            {visibleEntries.length === 0 ? (
              <p className="text-center font-mono text-[11px] text-muted py-8">
                No published profit yet.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {visibleEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="px-3 sm:px-4 py-3"
                  >
                    {editId === entry.id ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-ink tabular-nums">{entry.year}</p>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Description"
                          className="w-full bg-paper border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full bg-paper border border-zinc-200 rounded-lg px-3 py-2 text-sm tabular-nums"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(entry.id)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-ink text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-zinc-100 text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`grid items-start sm:items-center gap-x-2 sm:gap-2 grid-cols-[2.75rem_1fr_4.5rem] ${
                            canEdit ? "sm:grid-cols-[4rem_1fr_6rem_auto]" : "sm:grid-cols-[4rem_1fr_6rem]"
                          }`}
                        >
                          <span className="text-sm font-bold text-ink tabular-nums leading-snug">
                            {entry.year}
                          </span>
                          <span className="text-sm text-zinc-600 sm:text-ink leading-snug break-words min-w-0">
                            {entry.title || "—"}
                          </span>
                          <span className="text-sm tabular-nums font-semibold text-green-600 text-right sm:text-left leading-snug">
                            {formatTotal(entry.amount)}
                          </span>
                          {canEdit ? (
                            <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
                              {!entry.published ? (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                                  Draft
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => startEdit(entry)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border border-zinc-200 bg-white"
                              >
                                Edit
                              </button>
                              {!entry.published ? (
                                <button
                                  type="button"
                                  onClick={() => publishEntry(entry.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-500 text-white"
                                >
                                  Publish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => unpublishEntry(entry.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border border-zinc-200 text-muted bg-white"
                                >
                                  Unpublish
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteEntry(entry.id)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-200 text-red-600 bg-white"
                              >
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                        {canEdit ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 sm:hidden">
                            {!entry.published ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
                                Draft
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEdit(entry)}
                              className="text-[10px] font-bold uppercase tracking-wider text-ink"
                            >
                              Edit
                            </button>
                            <div className="inline-flex items-center gap-3">
                              {!entry.published ? (
                                <button
                                  type="button"
                                  onClick={() => publishEntry(entry.id)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-green-600"
                                >
                                  Publish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => unpublishEntry(entry.id)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-muted"
                                >
                                  Unpublish
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteEntry(entry.id)}
                                className="text-[10px] font-bold uppercase tracking-wider text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {saveError ? (
            <p className="mt-3 text-center text-xs text-red-600">{saveError}</p>
          ) : null}

          <PawlpiProfitChart publishedEntries={publishedEntries} />
        </>
      )}
    </section>
  );
}
