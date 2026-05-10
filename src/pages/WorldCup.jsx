import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/** Official match teams — set on the Result (admin) page; predictors see these names. */
const WC_MATCH_SETTINGS_REF = doc(db, 'worldcup_settings', 'match')

const PLACEHOLDER_WORLDCUP_IMAGE_URL =
  'https://pbs.twimg.com/media/HHqhM9ZWMAQVmCr.jpg'

const MAIN_BG_STYLE = {
  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url(${PLACEHOLDER_WORLDCUP_IMAGE_URL})`,
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
}

const SUBMITTED_LIST_MAX_H = { maxHeight: 'min(70vh, 900px)' }

export default function Worldcup() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [teamA, setTeamA] = useState('')
  const [scoreA, setScoreA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [matchTime, setMatchTime] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [items, setItems] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  const [officialTeamA, setOfficialTeamA] = useState('')
  const [officialTeamB, setOfficialTeamB] = useState('')

  const canSubmit = useMemo(() => {
    return (
      name.trim() &&
      phone.trim() &&
      teamA.trim() &&
      teamB.trim() &&
      String(scoreA).trim() !== '' &&
      String(scoreB).trim() !== '' &&
      matchTime.trim()
    )
  }, [matchTime, name, phone, scoreA, scoreB, teamA, teamB])

  /** Table headers — Firebase (Result page) first, else neutral label */
  const listHeaderTeamA = officialTeamA.trim() || 'Team A'
  const listHeaderTeamB = officialTeamB.trim() || 'Team B'

  useEffect(() => {
    const q = query(collection(db, 'worldcup_predictions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setItems(next)
        setLoadingList(false)
        setListError('')
      },
      (err) => {
        setLoadingList(false)
        setListError(err?.message || 'Failed to load submissions.')
      }
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      WC_MATCH_SETTINGS_REF,
      (snap) => {
        const d = snap.data()
        const a = typeof d?.teamA === 'string' ? d.teamA.trim() : ''
        const b = typeof d?.teamB === 'string' ? d.teamB.trim() : ''
        setOfficialTeamA(a)
        setOfficialTeamB(b)
        setTeamA(a)
        setTeamB(b)
      },
      () => {
        /* missing doc or permission — predictors can still type team names */
      }
    )
    return () => unsub()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!canSubmit) {
      setError('Please fill all fields.')
      return
    }

    const parsedScoreA = Number(scoreA)
    const parsedScoreB = Number(scoreB)
    if (!Number.isFinite(parsedScoreA) || !Number.isFinite(parsedScoreB)) {
      setError('Scores must be numbers.')
      return
    }
    if (parsedScoreA < 0 || parsedScoreB < 0) {
      setError('Scores cannot be negative.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'worldcup_predictions'), {
        name: name.trim(),
        phone: phone.trim(),
        teamA: teamA.trim(),
        scoreA: parsedScoreA,
        teamB: teamB.trim(),
        scoreB: parsedScoreB,
        matchTime: matchTime.trim(),
        createdAt: serverTimestamp(),
      })

      setScoreA('')
      setScoreB('')
      setMatchTime('')
      setTeamA(officialTeamA)
      setTeamB(officialTeamB)
    } catch (err) {
      setError('Failed to submit. ' + (err?.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen pt-[10px] lg:pt-[105px] pb-20" style={MAIN_BG_STYLE}>
      <div className="relative z-10 max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: first section (intro + form) */}
          <section className="rounded-2xl border border-white/20 overflow-x-clip">
            <div className="p-4 md:p-2 border-b border-white/40">
              <h1
                className="text-2xl md:text-3xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Worldcup Predictions
              </h1>
              <p className="mt-2 text-sm md:text-base text-white">
                Predict the score and submit your details - name and phone.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 flex flex-col gap-5 bg-white/70">
              {(error || listError) && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
                  {error || listError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Phone number"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-semibold text-gray-800 mb-3">Match prediction</p>
                {(officialTeamA || officialTeamB) && (
                  <p className="text-xs text-zinc-600 mb-2">
                    Teams are set by the organizer. Only scores and time are yours to enter.
                  </p>
                )}

                {/* Line 1: team + score · VS centered · Line 3: team + score */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      readOnly={Boolean(officialTeamA)}
                      className={`min-h-11 flex-1 min-w-0 px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                        officialTeamA ? 'bg-zinc-100 text-zinc-800 cursor-not-allowed' : ''
                      }`}
                      placeholder={officialTeamA ? '' : 'Team A'}
                      required
                    />
                    <input
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="h-11 w-16 shrink-0 px-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center font-semibold"
                      placeholder="0"
                      inputMode="numeric"
                      type="number"
                      min={0}
                      required
                    />
                  </div>
                  <div className="py-1 text-center text-xs font-bold tracking-widest text-zinc-500">
                    VS
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      value={teamB}
                      onChange={(e) => setTeamB(e.target.value)}
                      readOnly={Boolean(officialTeamB)}
                      className={`min-h-11 flex-1 min-w-0 px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                        officialTeamB ? 'bg-zinc-100 text-zinc-800 cursor-not-allowed' : ''
                      }`}
                      placeholder={officialTeamB ? '' : 'Team B'}
                      required
                    />
                    <input
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="h-11 w-16 shrink-0 px-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center font-semibold"
                      placeholder="0"
                      inputMode="numeric"
                      type="number"
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="w-full min-h-11 px-3 py-2.5 sm:px-4 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setScoreA('')
                    setScoreB('')
                    setMatchTime('')
                    setTeamA(officialTeamA)
                    setTeamB(officialTeamB)
                  }}
                  className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-2 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </section>

          {/* Right: predictions submitted */}
          <aside className="rounded-2xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-md">
            <div className="p-6 md:p-8 border-b border-white/40 flex items-center justify-between gap-3 bg-white/40">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Submitted</h2>
                <p className="text-sm text-zinc-600">Latest predictions</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs text-zinc-600">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Live
                </span>
                <span className="text-xs font-semibold text-zinc-700 bg-white/80 border border-white/60 px-3 py-1.5 rounded-full">
                  {loadingList ? 'Loading...' : `${items.length} total`}
                </span>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-white/70 overflow-y-auto" style={SUBMITTED_LIST_MAX_H}>
              {loadingList ? (
                <div className="text-sm text-zinc-600">Loading submissions...</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-zinc-600">No submissions yet.</div>
              ) : (
                <div className="flex flex-col gap-0 rounded-xl border border-white/50 bg-white/60 overflow-hidden">
                  <div
                    className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.45fr)_minmax(0,0.45fr)] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-white/70 border-b border-zinc-200/80 text-zinc-600"
                    role="row"
                  >
                    <span
                      role="columnheader"
                      className="text-xs font-bold uppercase tracking-wide text-zinc-500"
                    >
                      Name
                    </span>
                    <div role="columnheader" className="min-w-0">
                      <span className="block text-xs font-bold text-zinc-800 normal-case tracking-normal leading-tight break-words">
                        {listHeaderTeamA}
                      </span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mt-0.5">
                        Predicted goal
                      </span>
                    </div>
                    <div role="columnheader" className="min-w-0">
                      <span className="block text-xs font-bold text-zinc-800 normal-case tracking-normal leading-tight break-words">
                        {listHeaderTeamB}
                      </span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mt-0.5">
                  
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-zinc-100">
                    {items.map((it) => {
                      return (
                        <div
                          key={it.id}
                          role="row"
                          className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.45fr)_minmax(0,0.45fr)] gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white/80 hover:bg-white transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-zinc-900 text-sm break-words">{it.name || '-'}</span>
                            <span className="mt-1 block text-[10px] text-zinc-500 sm:hidden">
                              {listHeaderTeamA}{' '}
                              <span className="font-bold tabular-nums text-zinc-800">
                                {Number.isFinite(it.scoreA) ? it.scoreA : '—'}
                              </span>
                              {' · '}
                              {listHeaderTeamB}{' '}
                              <span className="font-bold tabular-nums text-zinc-800">
                                {Number.isFinite(it.scoreB) ? it.scoreB : '—'}
                              </span>
                            </span>
                          </div>
                          <div className="flex sm:flex-col sm:items-start items-center gap-1 min-w-0">
                            <span className="text-xs font-semibold text-zinc-500 sm:hidden shrink-0">
                              {listHeaderTeamA}
                            </span>
                            <span className="inline-flex items-center justify-center min-w-9 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-900 text-base font-bold tabular-nums">
                              {Number.isFinite(it.scoreA) ? it.scoreA : '—'}
                            </span>
                          </div>
                          <div className="flex sm:flex-col sm:items-start items-center gap-1 min-w-0">
                            <span className="text-xs font-semibold text-zinc-500 sm:hidden shrink-0">
                              {listHeaderTeamB}
                            </span>
                            <span className="inline-flex items-center justify-center min-w-9 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-900 text-base font-bold tabular-nums">
                              {Number.isFinite(it.scoreB) ? it.scoreB : '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
