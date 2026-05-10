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

const SUBMITTED_LIST_MAX_H = {
  maxHeight: "min(70vh, 900px)",
};

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

  const canSubmit = useMemo(() => {
    return (
      name.trim() &&
      phone.trim() &&
      teamA.trim() &&
      teamB.trim() &&
      String(scoreA).trim() !== "" &&
      String(scoreB).trim() !== ""
    );
  }, [name, phone, teamA, teamB, scoreA, scoreB]);

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

        setOfficialTeamA(a);
        setOfficialTeamB(b);

        setTeamA(a);
        setTeamB(b);
      },
      () => {},
    );

    return () => unsub();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    setError("");

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
      className="relative min-h-screen pt-[10px] lg:pt-[105px] pb-20"
      style={MAIN_BG_STYLE}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT */}
          <section className="rounded-2xl border border-white/20 overflow-hidden backdrop-blur-md bg-black/10">
            <div className="p-5 border-b border-white/20">
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Football Match Predictions
              </h1>

              <p className="mt-2 text-sm text-white/90">
                Predict the score and submit your details.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 flex flex-col gap-6"
            >
              {(error || listError) && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error || listError}
                </div>
              )}

              {/* MATCH PREDICTION */}
              <div>
                <p className="text-sm font-bold text-white mb-3">
                  Match Prediction
                </p>

                {(officialTeamA || officialTeamB) && (
                  <p className="text-xs text-white/70 mb-4">
                    Teams are set by the organizer.
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {/* TEAM A */}
                  <div className="flex items-center gap-2">
                    <input
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      readOnly={Boolean(officialTeamA)}
                      placeholder="Team A"
                      required
                      className={`h-12 flex-1 min-w-0 px-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 ${
                        officialTeamA
                          ? "bg-zinc-100 text-zinc-800 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    />

                    <input
                      autoFocus
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      type="number"
                      min={0}
                      placeholder="0"
                      required
                      className="h-12 w-14 px-1 text-lg border border-gray-300 rounded-xl bg-white text-center font-extrabold outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="text-center text-xs font-bold tracking-[0.3em] text-white/70">
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
                      className={`h-12 flex-1 min-w-0 px-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 ${
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
                      className="h-12 w-14 px-1 text-lg border border-gray-300 rounded-xl bg-white text-center font-extrabold outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* USER DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone / UPI
                  </label>

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone or UPI ID"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-center gap-3 pt-2">
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
                  className="bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-xl transition-all duration-200"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-700 hover:bg-green-800 active:scale-[0.98] text-white font-bold py-3 px-5 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT SIDE */}
          <aside className="rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="p-3 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Submitted Predictions
                </h2>

                <p className="text-sm text-white/70">
                  Latest live entries
                </p>
              </div>

              <span className="inline-flex items-center whitespace-nowrap text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 px-5 py-3 rounded-full">
                {loadingList ? "Loading..." : `${items.length} total`}
              </span>
            </div>

            <div
              className="overflow-y-auto bg-transparent"
              style={SUBMITTED_LIST_MAX_H}
            >
              {loadingList ? (
                <div className="p-5 text-sm text-zinc-600">
                  Loading submissions...
                </div>
              ) : items.length === 0 ? (
                <div className="p-5 text-sm text-zinc-600">
                  ⚽ No predictions yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {items.map((it) => {
                    const resultColorA =
                      it.scoreA > it.scoreB
                        ? "bg-green-100 text-green-700"
                        : it.scoreA < it.scoreB
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700";

                    const resultColorB =
                      it.scoreB > it.scoreA
                        ? "bg-green-100 text-green-700"
                        : it.scoreB < it.scoreA
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700";

                    return (
                      <div
                        key={it.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-4 items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-white break-words">
                            {it.name}
                          </p>

                          <p className="text-xs text-white/70 mt-1">
                            {String(it.phone || "")
                              .slice(0, 5)
                              .padEnd(
                                String(it.phone || "").length,
                                "*",
                              )}
                          </p>
                        </div>

                        <div
                          className={`min-w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${resultColorA}`}
                        >
                          {it.scoreA}
                        </div>

                        <div
                          className={`min-w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${resultColorB}`}
                        >
                          {it.scoreB}
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