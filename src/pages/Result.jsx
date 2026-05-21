import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { db } from "../firebase";

const WC_MATCH_SETTINGS_REF = doc(db, "worldcup_settings", "match");

function readMatchLive(data) {
  const teamA = typeof data?.teamA === "string" ? data.teamA.trim() : "";
  const teamB = typeof data?.teamB === "string" ? data.teamB.trim() : "";

  if (!teamA || !teamB) return false;
  if (data?.isLive === false) return false;

  return data?.isLive === true;
}

async function deletePredictionDocs(predictionItems) {
  const list = Array.isArray(predictionItems) ? predictionItems : [];

  if (list.length === 0) return 0;

  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);

    for (const it of list.slice(i, i + BATCH_SIZE)) {
      if (!it?.id) continue;
      batch.delete(doc(db, "worldcup_predictions", it.id));
      deleted += 1;
    }

    await batch.commit();
  }

  return deleted;
}

async function deleteAllPredictions() {
  const snap = await getDocs(collection(db, "worldcup_predictions"));

  return deletePredictionDocs(
    snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  );
}

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

/** Most-submitted score lines first; rarest score lines last. */
function comparePredictionGroupsByPopularity(a, b) {
  const byCount = b.entries.length - a.entries.length;
  if (byCount !== 0) return byCount;
  return comparePredictionGroups(a, b);
}

function formatScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "—";
}

function buildPdfTableBody(groups) {
  const rows = [];

  for (const group of groups) {
    for (const it of group.entries) {
      rows.push([
        String(it.name || "—").trim() || "—",
        String(it.phone || "—").trim() || "—",
        formatScore(it.scoreA),
        formatScore(it.scoreB),
      ]);
    }
  }

  return rows;
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

  const [savedTeamA, setSavedTeamA] = useState("");
  const [savedTeamB, setSavedTeamB] = useState("");
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [matchLive, setMatchLive] = useState(false);

  const [savingTeams, setSavingTeams] = useState(false);
  const [teamsSaveMessage, setTeamsSaveMessage] = useState("");

  const [deletingLive, setDeletingLive] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);

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

        const teamA = typeof d?.teamA === "string" ? d.teamA : "";
        const teamB = typeof d?.teamB === "string" ? d.teamB : "";

        setAdminTeamA(teamA);
        setAdminTeamB(teamB);
        setSavedTeamA(teamA);
        setSavedTeamB(teamB);
        setActiveMatchId(
          typeof d?.activeMatchId === "string" && d.activeMatchId.trim()
            ? d.activeMatchId.trim()
            : null,
        );
        setMatchLive(readMatchLive(d));
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

    const teamA = adminTeamA.trim();
    const teamB = adminTeamB.trim();

    if (!teamA || !teamB) {
      setTeamsSaveMessage("Enter both team names before saving.");
      setSavingTeams(false);
      return;
    }

    try {
      const newMatchId = String(Date.now());

      await setDoc(
        WC_MATCH_SETTINGS_REF,
        {
          teamA,
          teamB,
          isLive: true,
          activeMatchId: newMatchId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setTeamsSaveMessage(
        "Saved and live. The Worldcup form is open for predictions.",
      );
    } catch (err) {
      setTeamsSaveMessage("Save failed: " + (err?.message || "Unknown error"));
    } finally {
      setSavingTeams(false);
    }
  }

  async function handleDeleteLiveMatch() {
    if (deletingLive || !matchLive) return;

    const ok = window.confirm(
      "End this live match and delete ALL predictions for it? This cannot be undone. Public submit will be disabled.",
    );

    if (!ok) return;

    setTeamsSaveMessage("");
    setDeletingLive(true);

    try {
      const sessionItems = activeMatchId
        ? items.filter((it) => it.matchId === activeMatchId)
        : items;

      let deletedCount = await deletePredictionDocs(sessionItems);

      if (deletedCount === 0 && items.length > 0) {
        deletedCount = await deleteAllPredictions();
      }

      await setDoc(
        WC_MATCH_SETTINGS_REF,
        {
          isLive: false,
          activeMatchId: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setMatchLive(false);
      setActiveMatchId(null);
      setItems((prev) =>
        activeMatchId
          ? prev.filter((it) => it.matchId !== activeMatchId)
          : [],
      );

      setTeamsSaveMessage(
        `Live match ended. Deleted ${deletedCount} prediction${deletedCount === 1 ? "" : "s"}. Worldcup submit is disabled.`,
      );
    } catch (err) {
      setTeamsSaveMessage(
        "Could not end match: " + (err?.message || "Unknown error"),
      );
    } finally {
      setDeletingLive(false);
    }
  }

  const resultItems = useMemo(() => {
    if (!matchLive || !activeMatchId) return [];

    return items.filter((it) => it.matchId === activeMatchId);
  }, [items, matchLive, activeMatchId]);

  const predictionGroups = useMemo(() => {
    const map = new Map();

    for (const it of resultItems) {
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

    groups.sort(comparePredictionGroupsByPopularity);

    return groups;
  }, [resultItems]);

  const totalSubmissions = resultItems.length;

  function handleDownloadPdf() {
    if (pdfGenerating || predictionGroups.length === 0) return;

    setPdfGenerating(true);

    try {
      const teamAHeader =
        adminTeamA.trim() ||
        predictionGroups[0]?.representative?.teamA ||
        "Team A";
      const teamBHeader =
        adminTeamB.trim() ||
        predictionGroups[0]?.representative?.teamB ||
        "Team B";

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      doc.setFontSize(16);
      doc.text("NIPIPAAK WORLDCUP PREDICTION — Results", 14, 16);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(
        `${teamAHeader} vs ${teamBHeader} · ${totalSubmissions} submission${totalSubmissions === 1 ? "" : "s"} · sorted by most picked score`,
        14,
        23,
      );
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 28,
        head: [["Name", "Phone / UPI", teamAHeader, teamBHeader]],
        body: buildPdfTableBody(predictionGroups),
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [22, 101, 52],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 52 },
          1: { cellWidth: 48 },
          2: { halign: "center", cellWidth: 28 },
          3: { halign: "center", cellWidth: 28 },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      const dateStamp = new Date().toISOString().slice(0, 10);
      doc.save(`nipipaak-worldcup-results-${dateStamp}.pdf`);
    } catch (err) {
      console.error(err);
      window.alert("Could not create PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  }

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

        {/* MATCH ADMIN: setup (left) + live match (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 bg-amber-100">
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-950">
                Match Setup
              </h2>

              <p className="mt-1 text-xs text-amber-900/80">
                Set teams and save to open public predictions.
              </p>
            </div>

            <form
              onSubmit={handleSaveMatchTeams}
              className="p-5 flex flex-col gap-4"
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
                    className="h-[48px] w-full px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold disabled:opacity-60 transition-colors"
                  >
                    {savingTeams ? "Saving..." : "Save & go live"}
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

          <section className="rounded-2xl border border-green-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-green-200 bg-green-50 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-green-950">
                  Live Match
                </h2>

                <p className="mt-1 text-xs text-green-900/80">
                  Active match on the public Worldcup page.
                </p>
              </div>

              {matchLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              ) : null}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-5">
              {settingsLoading ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : matchLive ? (
                <div className="rounded-xl border border-green-200 bg-green-50/80 px-4 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-800 mb-3">
                    Now accepting predictions
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-bold text-zinc-900">
                    <span>{savedTeamA}</span>
                    <span className="text-xs font-bold tracking-widest text-zinc-500">
                      VS
                    </span>
                    <span>{savedTeamB}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-zinc-700">
                    No live match
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Save teams on the left to go live, or a previous match was
                    ended.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] text-zinc-500 text-center">
                  Also removes every prediction submitted for this match.
                </p>

                <button
                  type="button"
                  onClick={handleDeleteLiveMatch}
                  disabled={!matchLive || deletingLive || settingsLoading}
                  className="w-full h-11 rounded-xl border border-red-300 bg-red-50 text-red-800 text-sm font-bold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingLive ? "Deleting..." : "Delete live match & predictions"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* PREDICTIONS */}
        {listLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
            Loading submissions...
          </div>
        ) : predictionGroups.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
            {matchLive && activeMatchId
              ? "No submissions yet for this live match."
              : "No live match. Save teams to go live, or predictions were cleared."}
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

        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={
              pdfGenerating || listLoading || predictionGroups.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3.5 shadow-md transition-colors"
          >
            {pdfGenerating ? "Preparing PDF..." : "Download all results (PDF)"}
          </button>

          {!listLoading && predictionGroups.length === 0 ? (
            <p className="text-xs text-zinc-500">
              PDF download is available once there are submissions.
            </p>
          ) : null}

          {!listLoading && predictionGroups.length > 0 ? (
            <p className="text-xs text-zinc-500 text-center max-w-md">
              PDF lists every entry: name, phone/UPI, then scores. Most-picked
              score lines appear first; rare picks are at the bottom.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
