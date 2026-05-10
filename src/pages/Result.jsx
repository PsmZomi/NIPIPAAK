import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const WC_MATCH_SETTINGS_REF = doc(db, "worldcup_settings", "match");

function matchDateAndTime(value) {
  if (!value) return { dateStr: "-", timeStr: "" };

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return { dateStr: String(value), timeStr: "" };
  }

  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

  return { dateStr, timeStr };
}

function predictionGroupKey(it) {
  const a = String(it.teamA ?? "")
    .trim()
    .toLowerCase();
  const b = String(it.teamB ?? "")
    .trim()
    .toLowerCase();

  const sa = Number(it.scoreA);
  const sb = Number(it.scoreB);

  const na = Number.isFinite(sa) ? sa : "x";
  const nb = Number.isFinite(sb) ? sb : "x";

  return `${a}|${na}|${nb}|${b}`;
}

function scoreSortTuple(it) {
  const sa = Number(it.scoreA);
  const sb = Number(it.scoreB);

  return [
    Number.isFinite(sa) ? sa : Number.POSITIVE_INFINITY,
    Number.isFinite(sb) ? sb : Number.POSITIVE_INFINITY,
  ];
}

function comparePredictionGroups(a, b) {
  const [a1, a2] = scoreSortTuple(a.representative);
  const [b1, b2] = scoreSortTuple(b.representative);

  if (a1 !== b1) return a1 - b1;
  if (a2 !== b2) return a2 - b2;

  const na = String(a.representative.teamA || "").localeCompare(
    String(b.representative.teamA || ""),
    undefined,
    {
      sensitivity: "base",
    },
  );

  if (na !== 0) return na;

  return String(a.representative.teamB || "").localeCompare(
    String(b.representative.teamB || ""),
    undefined,
    {
      sensitivity: "base",
    },
  );
}

function createdAtMs(it) {
  const t = it.createdAt;

  if (!t) return 0;

  if (typeof t.toMillis === "function") return t.toMillis();

  if (typeof t.seconds === "number") return t.seconds * 1000;

  return 0;
}

export default function Result() {
  const [items, setItems] = useState([]);

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [adminTeamA, setAdminTeamA] = useState("");
  const [adminTeamB, setAdminTeamB] = useState("");

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  const [savingTeams, setSavingTeams] = useState(false);
  const [teamsSaveMessage, setTeamsSaveMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "worldcup_predictions"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );

        setListLoading(false);
        setListError("");
      },
      (err) => {
        setListLoading(false);
        setListError(err?.message || "Failed to load submissions.");
      },
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      WC_MATCH_SETTINGS_REF,
      (snap) => {
        setSettingsLoading(false);
        setSettingsError("");

        const d = snap.data();

        setAdminTeamA(typeof d?.teamA === "string" ? d.teamA : "");
        setAdminTeamB(typeof d?.teamB === "string" ? d.teamB : "");
      },
      (err) => {
        setSettingsLoading(false);
        setSettingsError(err?.message || "Could not load match settings.");
      },
    );

    return () => unsub();
  }, []);

  async function handleSaveMatchTeams(e) {
    e.preventDefault();

    setTeamsSaveMessage("");
    setSavingTeams(true);

    try {
      await setDoc(
        WC_MATCH_SETTINGS_REF,
        {
          teamA: adminTeamA.trim(),
          teamB: adminTeamB.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setTeamsSaveMessage(
        "Saved. The Worldcup form will show these team names.",
      );
    } catch (err) {
      setTeamsSaveMessage("Save failed: " + (err?.message || "Unknown error"));
    } finally {
      setSavingTeams(false);
    }
  }

  const predictionGroups = useMemo(() => {
    const map = new Map();

    for (const it of items) {
      const k = predictionGroupKey(it);

      if (!map.has(k)) {
        map.set(k, []);
      }

      map.get(k).push(it);
    }

    const groups = [...map.values()].map((list) => {
      const sortedList = [...list].sort(
        (x, y) => createdAtMs(y) - createdAtMs(x),
      );

      return {
        key: predictionGroupKey(sortedList[0]),
        representative: sortedList[0],
        entries: sortedList,
      };
    });

    groups.sort(comparePredictionGroups);

    return groups;
  }, [items]);

  return (
    <main className="min-h-screen pt-[50px] lg:pt-[120px] pb-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        {/* TOP */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-zinc-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              World Cup Admin & Results
            </h1>

            <p className="mt-1 text-sm text-zinc-600">
              Set official match teams and view grouped predictions.
            </p>
          </div>

          <Link
            to="/worldcup"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Open public prediction form →
          </Link>
        </div>

        {(listError || settingsError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm mb-5">
            {listError ? <p>{listError}</p> : null}
            {settingsError ? <p>{settingsError}</p> : null}
          </div>
        )}

        {/* ADMIN PANEL TOP */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-amber-200 bg-amber-100">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-950">
              Match Setup
            </h2>

            <p className="mt-1 text-xs text-amber-900/80">
              Official teams shown on the prediction page.
            </p>
          </div>

          <form
            onSubmit={handleSaveMatchTeams}
            className="p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
          >
            {settingsLoading ? (
              <p className="text-sm text-amber-900/70">Loading settings...</p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                    Team A
                  </label>

                  <input
                    value={adminTeamA}
                    onChange={(e) => {
                      setAdminTeamA(e.target.value);
                      setTeamsSaveMessage("");
                    }}
                    className="w-full px-3 py-3 border border-amber-300 rounded-xl bg-white text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Example: Arsenal"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                    Team B
                  </label>

                  <input
                    value={adminTeamB}
                    onChange={(e) => {
                      setAdminTeamB(e.target.value);
                      setTeamsSaveMessage("");
                    }}
                    className="w-full px-3 py-3 border border-amber-300 rounded-xl bg-white text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Example: Paris St Germain"
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingTeams}
                  className="h-[48px] px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold disabled:opacity-60 transition-colors"
                >
                  {savingTeams ? "Saving..." : "Save Teams"}
                </button>
              </>
            )}
          </form>

          {teamsSaveMessage ? (
            <div className="px-5 pb-4 text-xs text-amber-900">
              {teamsSaveMessage}
            </div>
          ) : null}
        </section>

        {/* PREDICTIONS */}
        {listLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
            Loading submissions...
          </div>
        ) : predictionGroups.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
            No submissions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            {predictionGroups.map((group) => {
              const g = group.representative;

              return (
                <article
                  key={group.key}
                  className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col"
                >
                  {/* HEADER */}
                  <div className="px-4 py-4 bg-zinc-100 border-b border-zinc-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                      Prediction
                    </p>

                    {/* ONE LINE MATCH */}
                    <div className="flex items-center flex-nowrap overflow-x-auto whitespace-nowrap gap-2 text-sm text-zinc-900 scrollbar-hide">
                      <span className="font-semibold shrink-0">
                        {g.teamA || "Team A"}
                      </span>

                      <span className="inline-flex shrink-0 items-center justify-center min-w-8 h-7 px-2 rounded bg-white border border-zinc-200 text-xs font-bold tabular-nums">
                        {Number.isFinite(g.scoreA) ? g.scoreA : "—"}
                      </span>

                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 shrink-0">
                        VS
                      </span>

                      <span className="inline-flex shrink-0 items-center justify-center min-w-8 h-7 px-2 rounded bg-white border border-zinc-200 text-xs font-bold tabular-nums">
                        {Number.isFinite(g.scoreB) ? g.scoreB : "—"}
                      </span>

                      <span className="font-semibold shrink-0">
                        {g.teamB || "Team B"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-zinc-600">
                      {group.entries.length} submission
                      {group.entries.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {/* USERS */}
                  <ul className="divide-y divide-zinc-100 flex-1">
                    {group.entries.map((it) => {
                      const { dateStr, timeStr } = matchDateAndTime(
                        it.matchTime,
                      );

                      const timeDisplay = timeStr
                        ? `${dateStr} · ${timeStr}`
                        : dateStr;

                      return (
                        <li key={it.id} className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
                            <div className="font-semibold text-zinc-900 shrink-0">
                              {it.name || "—"}
                            </div>

                            <div className="text-zinc-700 tabular-nums shrink-0">
                              {it.phone || "—"}
                            </div>

                            <div className="text-xs text-zinc-500 shrink-0">
                              {timeDisplay}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
