import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const WC_MATCH_SETTINGS_REF = doc(db, "worldcup_settings", "match");

const PLACEHOLDER_WORLDCUP_IMAGE_URL =
  "https://pbs.twimg.com/media/HHqhM9ZWMAQVmCr.jpg";

const MAIN_BG_STYLE = {
  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${PLACEHOLDER_WORLDCUP_IMAGE_URL})`,
  backgroundSize: "contain",
  backgroundPosition: "center",
  backgroundAttachment:
    typeof window !== "undefined" && window.innerWidth < 768
      ? "scroll"
      : "fixed",
};

const PREDICTIONS_GRID =
  "grid grid-cols-[1fr_3.5rem_3.5rem] gap-2 px-3 lg:gap-3 lg:px-4";

const TEAM_COL =
  "w-14 flex flex-col items-center gap-0.5 lg:gap-1 shrink-0";

const SCORE_BOX =
  "w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center font-extrabold text-base lg:text-lg shrink-0";

function firstThreeWords(text, fallback) {
  const label = (text || fallback).trim();
  if (!label) return fallback;
  return label.split(/\s+/).slice(0, 3).join(" ");
}

function predictionsForCurrentMatch(items, activeMatchId, teamA, teamB) {
  const a = teamA.trim().toLowerCase();
  const b = teamB.trim().toLowerCase();

  const byMatchId = activeMatchId
    ? items.filter((it) => it.matchId === activeMatchId)
    : [];

  if (byMatchId.length > 0) return byMatchId;

  if (!a || !b) return [];

  return items.filter((it) => {
    const ta = String(it.teamA ?? "")
      .trim()
      .toLowerCase();
    const tb = String(it.teamB ?? "")
      .trim()
      .toLowerCase();

    return ta === a && tb === b;
  });
}

export default function Worldcup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [teamA, setTeamA] = useState("");
  const [scoreA, setScoreA] = useState("");

  const [teamB, setTeamB] = useState("");
  const [scoreB, setScoreB] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [officialTeamA, setOfficialTeamA] = useState("");
  const [officialTeamB, setOfficialTeamB] = useState("");
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [matchLive, setMatchLive] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      matchLive &&
      activeMatchId &&
      name.trim() &&
      phone.trim() &&
      teamA.trim() &&
      teamB.trim() &&
      String(scoreA).trim() !== "" &&
      String(scoreB).trim() !== ""
    );
  }, [matchLive, activeMatchId, name, phone, teamA, teamB, scoreA, scoreB]);

  const visibleItems = useMemo(
    () =>
      predictionsForCurrentMatch(
        items,
        activeMatchId,
        officialTeamA,
        officialTeamB,
      ),
    [items, activeMatchId, officialTeamA, officialTeamB],
  );

  const hasActiveMatch = Boolean(
    activeMatchId || (officialTeamA.trim() && officialTeamB.trim()),
  );

  const formOpen = matchLive && activeMatchId;

  useEffect(() => {
    const q = query(
      collection(db, "worldcup_predictions"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setItems(next);
        setLoadingList(false);
        setListError("");
      },
      (err) => {
        setLoadingList(false);
        setListError(err?.message || "Failed to load submissions.");
      },
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      WC_MATCH_SETTINGS_REF,
      (snap) => {
        const d = snap.data();

        const a = typeof d?.teamA === "string" ? d.teamA.trim() : "";
        const b = typeof d?.teamB === "string" ? d.teamB.trim() : "";
        const matchId =
          typeof d?.activeMatchId === "string" && d.activeMatchId.trim()
            ? d.activeMatchId.trim()
            : null;
        const live =
          Boolean(a && b && matchId) &&
          d?.isLive !== false &&
          d?.isLive === true;

        setOfficialTeamA(a);
        setOfficialTeamB(b);
        setActiveMatchId(matchId);
        setMatchLive(live);

        setTeamA(a);
        setTeamB(b);
      },
      () => {
        setActiveMatchId(null);
        setMatchLive(false);
      },
    );

    return () => unsub();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    setError("");

    if (!matchLive || !activeMatchId) {
      setError("Predictions are closed. No live match is active.");
      return;
    }

    if (!canSubmit) {
      setError("Please fill all fields.");
      return;
    }

    const parsedScoreA = Number(scoreA);
    const parsedScoreB = Number(scoreB);

    if (!Number.isFinite(parsedScoreA) || !Number.isFinite(parsedScoreB)) {
      setError("Scores must be numbers.");
      return;
    }

    if (parsedScoreA < 0 || parsedScoreB < 0) {
      setError("Scores cannot be negative.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "worldcup_predictions"), {
        name: name.trim(),
        phone: phone.trim(),
        teamA: teamA.trim(),
        scoreA: parsedScoreA,
        teamB: teamB.trim(),
        scoreB: parsedScoreB,
        matchId: activeMatchId,
        createdAt: serverTimestamp(),
      });

      setScoreA("");
      setScoreB("");
      setName("");
      setPhone("");

      setTeamA(officialTeamA);
      setTeamB(officialTeamB);
    } catch (err) {
      setError("Failed to submit. " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="relative min-h-screen pt-[20px] lg:pt-[24px] pb-10"
      style={MAIN_BG_STYLE}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-5">
        <header className="text-center mb-3 lg:mb-6">
          <h1
            className="text-xl lg:text-3xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            NIPIPAAK WORLDCUP PREDICTION
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 items-start">
          {/* LEFT */}
          <section className="rounded-2xl overflow-hidden bg-black/10">
            <div className="p-3 lg:p-5 border-b border-white/10">
              <h2
                className="text-xl lg:text-2xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Football Match Predictions
              </h2>

              <p className="mt-1 lg:mt-1 text-xs lg:text-sm text-white/90">
                Predict the score and submit your details.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-1 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6"
            >
              {(error || listError) && (
                <div className="bg-red-100 text-red-700 px-3 py-2 lg:px-4 lg:py-3 rounded-xl text-sm font-medium">
                  {error || listError}
                </div>
              )}

              {!formOpen && (
                <div className="bg-amber-100 text-amber-900 px-3 py-2 lg:px-4 lg:py-3 rounded-xl text-sm font-medium">
                  {hasActiveMatch && !matchLive
                    ? "This match is disabled. Submit and Clear are turned off."
                    : "Predictions are closed. Wait for the next live match."}
                </div>
              )}

              {/* MATCH PREDICTION */}
              <div>
                <div className="flex flex-col gap-1.5 lg:gap-3">
                  {/* TEAM A */}
                  <div className="flex items-center gap-2">
                    <input
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      readOnly={Boolean(officialTeamA)}
                      placeholder="Team A"
                      required
                      className={`h-10 lg:h-12 flex-1 min-w-0 px-3 lg:px-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 ${
                        officialTeamA
                          ? "bg-00 text-red-700 cursor-not-allowed"
                          : "bg-"
                      }`}
                    />

                    <input
                      autoFocus={formOpen}
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      type="number"
                      min={0}
                      placeholder="0"
                      required
                      disabled={!formOpen}
                      className="h-10 lg:h-12 w-12 lg:w-14 px-1 text-base lg:text-lg border border-gray-300 rounded-xl bg-white text-center font-extrabold outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="text-center text-[10px] lg:text-xs font-bold tracking-[0.25em] lg:tracking-[0.3em] text-white/70 py-0.5">
                    VS
                  </div>

                  {/* TEAM B */}
                  <div className="flex items-center gap-2">
                    <input
                      value={teamB}
                      onChange={(e) => setTeamB(e.target.value)}
                      readOnly={Boolean(officialTeamB)}
                      placeholder="Team B"
                      required
                      className={`h-10 lg:h-12 flex-1 min-w-0 px-3 lg:px-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 ${
                        officialTeamB
                          ? "bg-zinc-100 text-zinc-800 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    />

                    <input
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      type="number"
                      min={0}
                      placeholder="0"
                      required
                      disabled={!formOpen}
                      className="h-10 lg:h-12 w-12 lg:w-14 px-1 text-base lg:text-lg border border-gray-300 rounded-xl bg-white text-center font-extrabold outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* USER DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-white mb-1 lg:mb-2">
                    Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    disabled={!formOpen}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs lg:text-sm font-medium text-white mb-1 lg:mb-2">
                    Phone / UPI
                  </label>

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone or UPI ID"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    disabled={!formOpen}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-center gap-2 lg:gap-3 pt-0 lg:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setScoreA("");
                    setScoreB("");
                    setName("");
                    setPhone("");

                    setTeamA(officialTeamA);
                    setTeamB(officialTeamB);
                  }}
                  disabled={!formOpen}
                  className="bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white font-bold py-2 lg:py-3 px-4 lg:px-5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={submitting || !formOpen}
                  className="bg-green-700 hover:bg-green-800 active:scale-[0.98] text-white font-bold py-2 lg:py-3 px-4 lg:px-5 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Submitting..."
                    : formOpen
                      ? "Submit"
                      : "Predictions closed"}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT SIDE: LIVE FEED SCROLLER */}
          <aside className="rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[min(65vh,560px)] sm:max-h-[min(70vh,720px)] lg:max-h-[calc(100vh-9rem)] lg:sticky lg:top-28">
              <div className="shrink-0 p-2 border-b border-zinc-200 space-y-1 lg:space-y-2">
                <div className="lg:hidden leading-tight">
                  <h2 className="text-base font-bold text-white text-center">Submitted Predictions</h2>
                  <p className="text-xs text-white/70 text-center">Latest live entries</p>
                </div>

                <div className={`${PREDICTIONS_GRID} items-end lg:hidden`}>
                  <span className="inline-flex w-fit items-center whitespace-nowrap text-sm font-semibold text-white px-2 py-0.5 rounded-full">
                    {loadingList ? "Loading..." : `${visibleItems.length} total`}
                  </span>
                  <div className={TEAM_COL}>
                    <span className="text-center text-[10px] leading-tight font-bold text-white">
                      {firstThreeWords(officialTeamA, "Team A")}
                    </span>
                  </div>
                  <div className={TEAM_COL}>
                    <span className="text-center text-[10px] leading-tight font-bold text-white">
                      {firstThreeWords(officialTeamB, "Team B")}
                    </span>
                  </div>
                </div>

                <div className="relative hidden lg:block min-h-[4.5rem]">
                  <div className={`${PREDICTIONS_GRID} items-end`}>
                    <div>
                      <h2 className="text-lg font-bold text-white">Submitted Predictions</h2>
                      <p className="text-sm text-white/70">Latest live entries</p>
                    </div>
                    <div className={TEAM_COL}>
                      <span className="text-center text-xs font-bold text-white leading-tight">
                        {officialTeamA || "Team A"}
                      </span>
                    </div>
                    <div className={TEAM_COL}>
                      <span className="text-center text-xs font-bold text-white leading-tight">
                        {officialTeamB || "Team B"}
                      </span>
                    </div>
                  </div>
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center whitespace-nowrap text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 px-5 py-3 rounded-full">
                    {loadingList ? "Loading..." : `${visibleItems.length} total`}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-transparent">
                {loadingList ? (
                  <div className="p-3 lg:p-5 text-sm text-zinc-300">Loading submissions...</div>
                ) : visibleItems.length === 0 ? (
                  <div className="p-3 lg:p-5 text-sm text-zinc-300">
                    {hasActiveMatch
                      ? matchLive
                        ? "⚽ No predictions yet."
                        : "Match disabled — submissions closed."
                      : "No predictions for this match."}
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {visibleItems.map((it) => {
                      let resultColorA = "bg-yellow-100 text-yellow-700";
                      let resultColorB = "bg-yellow-100 text-yellow-700";

                      if (Number(it.scoreA) > Number(it.scoreB)) {
                        resultColorA = "bg-green-100 text-green-700";
                        resultColorB = "bg-red-100 text-red-700";
                      } else if (Number(it.scoreA) < Number(it.scoreB)) {
                        resultColorA = "bg-red-100 text-red-700";
                        resultColorB = "bg-green-100 text-green-700";
                      }

                      return (
                        <div key={it.id} className={`${PREDICTIONS_GRID} py-1.5 lg:py-4 items-start`}>
                          <div className="min-w-0 leading-tight">
                            <p className="text-sm lg:text-base font-bold text-white break-words">{it.name}</p>
                            <p className="text-[11px] lg:text-xs text-white/70 mt-0 lg:mt-1">
                              {String(it.phone || "")
                                .slice(0, 5)
                                .padEnd(String(it.phone || "").length, "*")}
                            </p>
                          </div>
                          <div className={TEAM_COL}>
                            <div className={`${SCORE_BOX} ${resultColorA}`}>{it.scoreA}</div>
                          </div>
                          <div className={TEAM_COL}>
                            <div className={`${SCORE_BOX} ${resultColorB}`}>{it.scoreB}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }