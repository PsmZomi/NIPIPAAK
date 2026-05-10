import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

/** Same document the Worldcup page reads — official Team A / Team B names for the match. */
const WC_MATCH_SETTINGS_REF = doc(db, 'worldcup_settings', 'match')

function matchDateAndTime(value) {
  if (!value) return { dateStr: '-', timeStr: '' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { dateStr: String(value), timeStr: '' }
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
  return { dateStr, timeStr }
}

/** Stable key so the same scoreline (same teams + scores) groups together */
function predictionGroupKey(it) {
  const a = String(it.teamA ?? '').trim().toLowerCase()
  const b = String(it.teamB ?? '').trim().toLowerCase()
  const sa = Number(it.scoreA)
  const sb = Number(it.scoreB)
  const na = Number.isFinite(sa) ? sa : 'x'
  const nb = Number.isFinite(sb) ? sb : 'x'
  return `${a}|${na}|${nb}|${b}`
}

function scoreSortTuple(it) {
  const sa = Number(it.scoreA)
  const sb = Number(it.scoreB)
  return [
    Number.isFinite(sa) ? sa : Number.POSITIVE_INFINITY,
    Number.isFinite(sb) ? sb : Number.POSITIVE_INFINITY,
  ]
}

function comparePredictionGroups(a, b) {
  const [a1, a2] = scoreSortTuple(a.representative)
  const [b1, b2] = scoreSortTuple(b.representative)
  if (a1 !== b1) return a1 - b1
  if (a2 !== b2) return a2 - b2
  const na = String(a.representative.teamA || '').localeCompare(String(b.representative.teamA || ''), undefined, {
    sensitivity: 'base',
  })
  if (na !== 0) return na
  return String(a.representative.teamB || '').localeCompare(String(b.representative.teamB || ''), undefined, {
    sensitivity: 'base',
  })
}

function createdAtMs(it) {
  const t = it.createdAt
  if (!t) return 0
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (typeof t.seconds === 'number') return t.seconds * 1000
  return 0
}

export default function Result() {
  const [items, setItems] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [adminTeamA, setAdminTeamA] = useState('')
  const [adminTeamB, setAdminTeamB] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [savingTeams, setSavingTeams] = useState(false)
  const [teamsSaveMessage, setTeamsSaveMessage] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'worldcup_predictions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setListLoading(false)
        setListError('')
      },
      (err) => {
        setListLoading(false)
        setListError(err?.message || 'Failed to load submissions.')
      }
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      WC_MATCH_SETTINGS_REF,
      (snap) => {
        setSettingsLoading(false)
        setSettingsError('')
        const d = snap.data()
        setAdminTeamA(typeof d?.teamA === 'string' ? d.teamA : '')
        setAdminTeamB(typeof d?.teamB === 'string' ? d.teamB : '')
      },
      (err) => {
        setSettingsLoading(false)
        setSettingsError(err?.message || 'Could not load match settings.')
      }
    )
    return () => unsub()
  }, [])

  async function handleSaveMatchTeams(e) {
    e.preventDefault()
    setTeamsSaveMessage('')
    setSavingTeams(true)
    try {
      await setDoc(
        WC_MATCH_SETTINGS_REF,
        {
          teamA: adminTeamA.trim(),
          teamB: adminTeamB.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      setTeamsSaveMessage('Saved. The Worldcup form will show these team names.')
    } catch (err) {
      setTeamsSaveMessage('Save failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setSavingTeams(false)
    }
  }

  const predictionGroups = useMemo(() => {
    const map = new Map()
    for (const it of items) {
      const k = predictionGroupKey(it)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(it)
    }
    const groups = [...map.values()].map((list) => {
      const sortedList = [...list].sort((x, y) => createdAtMs(y) - createdAtMs(x))
      return {
        key: predictionGroupKey(sortedList[0]),
        representative: sortedList[0],
        entries: sortedList,
      }
    })
    groups.sort(comparePredictionGroups)
    return groups
  }, [items])

  return (
    <main className="min-h-screen pt-[50px] lg:pt-[125px] pb-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-zinc-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              World Cup — admin & results
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Set official team names (first column); predictions are grouped below in three columns on large screens.
            </p>
          </div>
          <Link
            to="/worldcup"
            className="text-sm font-semibold text-green-700 hover:text-green-800 shrink-0"
          >
            Open public prediction form →
          </Link>
        </div>

        {(listError || settingsError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm mb-4 space-y-1">
            {listError ? <p>{listError}</p> : null}
            {settingsError ? <p>{settingsError}</p> : null}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-start">
          {/* Column 1: admin — official teams for the Worldcup page */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50/90 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-200/80 bg-amber-100/80">
              <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wide">Match setup</h2>
              <p className="mt-1 text-xs text-amber-900/80">
                Names saved here appear on the Worldcup page. Predictors cannot change them.
              </p>
            </div>
            <form onSubmit={handleSaveMatchTeams} className="p-4 flex flex-col gap-4">
              {settingsLoading ? (
                <p className="text-sm text-amber-900/70">Loading settings…</p>
              ) : (
                <>
                  <div>
                    <label htmlFor="admin-team-a" className="block text-xs font-semibold text-amber-950 mb-1.5">
                      Team A (home / first)
                    </label>
                    <input
                      id="admin-team-a"
                      value={adminTeamA}
                      onChange={(e) => {
                        setAdminTeamA(e.target.value)
                        setTeamsSaveMessage('')
                      }}
                      className="w-full px-3 py-2.5 text-sm border border-amber-300/80 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="e.g. Brazil"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-team-b" className="block text-xs font-semibold text-amber-950 mb-1.5">
                      Team B (away / second)
                    </label>
                    <input
                      id="admin-team-b"
                      value={adminTeamB}
                      onChange={(e) => {
                        setAdminTeamB(e.target.value)
                        setTeamsSaveMessage('')
                      }}
                      className="w-full px-3 py-2.5 text-sm border border-amber-300/80 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="e.g. Argentina"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingTeams}
                    className="w-full py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold disabled:opacity-60 transition-colors"
                  >
                    {savingTeams ? 'Saving…' : 'Save team names'}
                  </button>
                  {teamsSaveMessage ? (
                    <p className="text-xs text-amber-900/90 leading-snug">{teamsSaveMessage}</p>
                  ) : null}
                </>
              )}
            </form>
          </aside>

          {/* Predictions grid: 3 columns on lg */}
          <div className="flex-1 min-w-0">
            {listLoading ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
                Loading submissions…
              </div>
            ) : predictionGroups.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-12 text-center text-zinc-500 text-sm shadow-sm">
                No submissions yet. Share the Worldcup page after you save team names.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
                {predictionGroups.map((group) => {
                  const g = group.representative
                  return (
                    <article
                      key={group.key}
                      className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="px-4 py-3 bg-zinc-100/90 border-b border-zinc-200">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                          Prediction
                        </p>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-900">
                          <span className="font-semibold">{g.teamA || 'Team A'}</span>
                          <span className="inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-xs font-bold tabular-nums">
                            {Number.isFinite(g.scoreA) ? g.scoreA : '—'}
                          </span>
                          <span className="text-[10px] font-bold tracking-widest text-zinc-500">VS</span>
                          <span className="inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-xs font-bold tabular-nums">
                            {Number.isFinite(g.scoreB) ? g.scoreB : '—'}
                          </span>
                          <span className="font-semibold">{g.teamB || 'Team B'}</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-600">
                          {group.entries.length} submission{group.entries.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <ul className="divide-y divide-zinc-100 flex-1">
                        {group.entries.map((it) => {
                          const { dateStr, timeStr } = matchDateAndTime(it.matchTime)
                          const timeDisplay = timeStr ? `${dateStr} · ${timeStr}` : dateStr
                          return (
                            <li key={it.id} className="px-4 py-3 text-sm">
                              <div className="font-semibold text-zinc-900">{it.name || '—'}</div>
                              <div className="mt-1 text-zinc-700 tabular-nums">{it.phone || '—'}</div>
                              <div className="mt-1 text-xs text-zinc-500">{timeDisplay}</div>
                            </li>
                          )
                        })}
                      </ul>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
