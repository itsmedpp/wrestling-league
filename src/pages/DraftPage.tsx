import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import {
  DEFAULT_DRAFT_ROUNDS,
  currentRound,
  isDraftComplete,
  pickingRosterId,
  totalPicks,
  undraftedPool,
} from '../draft'
import { PROMOTIONS, sortPool } from '../pool'
import type { Division, Draft, League } from '../types'

function when(iso: string): string {
  return iso ? new Date(iso).toLocaleString() : 'Unknown date'
}

function DraftBoard({ league, draft }: { league: League; draft: Draft }) {
  const rosterName = (id: string) => league.rosters.find((r) => r.id === id)?.name ?? 'Removed roster'
  const rounds = Array.from(new Set(draft.picks.map((p) => p.round)))

  return (
    <ul className="list">
      {rounds.map((round) => (
        <li key={round} className="stack">
          <strong>Round {round}</strong>
          <span className="muted">
            {draft.picks
              .filter((p) => p.round === round)
              .map((p) => `${rosterName(p.rosterId)}: ${p.name}`)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function DraftPage() {
  const { leagueId = '' } = useParams()
  const navigate = useNavigate()
  const { state, startDraft, draftWrestler, autoDraft, addPoolWrestler } = useLeague()
  const [rounds, setRounds] = useState(String(DEFAULT_DRAFT_ROUNDS))
  const [pick, setPick] = useState('')
  const [newName, setNewName] = useState('')
  const [promotion, setPromotion] = useState<string>(PROMOTIONS[0])
  const [division, setDivision] = useState<Division>('men')

  const league = state.leagues.find((l) => l.id === leagueId)

  if (!league) {
    return (
      <div className="page">
        <h1>League not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const draft = league.draft
  const running = draft && !isDraftComplete(draft)
  const onClockId = draft ? pickingRosterId(draft) : null
  const onClock = league.rosters.find((r) => r.id === onClockId)
  const available = sortPool(undraftedPool(league, state.pool))

  const begin = () => {
    const count = Number(rounds)
    if (!Number.isInteger(count) || count < 1) return
    const wrestlers = league.rosters.reduce((n, r) => n + r.wrestlers.length, 0)
    const warning = wrestlers > 0 ? ' This clears every wrestler and champion already on them.' : ''
    if (!confirm(`Draft ${count} wrestlers onto each of the ${league.rosters.length} rosters?${warning}`))
      return
    startDraft(league.id, count)
    setPick('')
  }

  const draftSelected = () => {
    const choice = state.pool.find((p) => p.id === pick)
    if (!choice) return
    draftWrestler(league.id, choice.name, choice.division)
    setPick('')
  }

  const draftNewName = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    addPoolWrestler(trimmed, promotion, division)
    draftWrestler(league.id, trimmed, division)
    setNewName('')
  }

  return (
    <div className="page">
      <div className="nav">
        <button className="secondary" onClick={() => navigate('/')}>
          ← Main page
        </button>
        <button className="secondary" onClick={() => navigate(`/league/${league.id}`)}>
          ← {league.name}
        </button>
      </div>

      <h1>{league.name} Draft</h1>
      <p className="subtitle">
        A snake draft that stocks this league's rosters from the shared roster pool.
      </p>

      <div className="card">
        <h2>{draft ? 'Start a new draft' : 'Start the draft'}</h2>
        {league.rosters.length === 0 ? (
          <p className="muted">Create at least one roster before drafting.</p>
        ) : (
          <div className="row">
            <label>
              Rounds per roster{' '}
              <input
                type="number"
                min={1}
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                style={{ width: '5rem' }}
              />
            </label>
            <button onClick={begin}>{draft ? 'Reset rosters and redraft' : 'Start draft'}</button>
          </div>
        )}
      </div>

      {draft && (
        <div className="card">
          <div className="row spread">
            <h2>{running ? `Round ${currentRound(draft)} of ${draft.rounds}` : 'Draft complete'}</h2>
            <span className="muted">
              {draft.picks.length} of {totalPicks(draft)} picks · started {when(draft.startedAt)}
            </span>
          </div>

          <p>
            Order:{' '}
            {draft.order
              .map((id) => league.rosters.find((r) => r.id === id)?.name ?? 'Removed roster')
              .join(' → ')}
          </p>

          {running && (
            <>
              <p>
                On the clock: <strong>{onClock ? onClock.name : 'Removed roster'}</strong>
              </p>
              <div className="row">
                <select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Pick from the roster pool…</option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.promotion || 'Unaffiliated'} · {p.division === 'men' ? "Men's" : "Women's"}
                    </option>
                  ))}
                </select>
                <button onClick={draftSelected} disabled={!pick}>
                  Draft pick
                </button>
                <button className="secondary" onClick={() => autoDraft(league.id, 1)}>
                  Random pick
                </button>
                <button
                  className="secondary"
                  onClick={() => autoDraft(league.id, totalPicks(draft) - draft.picks.length)}
                >
                  Auto-complete draft
                </button>
              </div>

              <h3>Draft someone new</h3>
              <div className="row">
                <input
                  value={newName}
                  placeholder="Wrestler not in the pool"
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draftNewName()}
                />
                <select value={promotion} onChange={(e) => setPromotion(e.target.value)}>
                  {PROMOTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select value={division} onChange={(e) => setDivision(e.target.value as Division)}>
                  <option value="men">Men's</option>
                  <option value="women">Women's</option>
                </select>
                <button onClick={draftNewName} disabled={!newName.trim()}>
                  Add to pool and draft
                </button>
              </div>
            </>
          )}

          <h3>Picks</h3>
          {draft.picks.length === 0 ? (
            <p className="muted">No picks yet.</p>
          ) : (
            <DraftBoard league={league} draft={draft} />
          )}
        </div>
      )}

      {league.draftHistory.length > 0 && (
        <div className="card">
          <h2>Draft history</h2>
          <ul className="list">
            {[...league.draftHistory].reverse().map((old) => (
              <li key={old.id} className="stack">
                <details>
                  <summary>
                    {when(old.startedAt)} · {old.rounds} rounds · {old.picks.length} picks
                  </summary>
                  <DraftBoard league={league} draft={old} />
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
