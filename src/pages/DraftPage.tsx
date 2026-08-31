import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import {
  DEFAULT_DRAFT_ROUNDS,
  canDraft,
  currentRound,
  isDraftComplete,
  picksFor,
  pickingRosterId,
  totalPicks,
  undraftedPool,
} from '../draft'
import { PROMOTIONS, sortPool } from '../pool'
import type { Division, Draft, League } from '../types'

/** Blank means no limit; any number, including 0, caps that division. */
function parseLimit(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const count = Number(trimmed)
  return Number.isInteger(count) && count >= 0 ? count : null
}

function when(iso: string): string {
  return iso ? new Date(iso).toLocaleString() : 'Unknown date'
}

function rosterName(league: League, id: string): string {
  return league.rosters.find((r) => r.id === id)?.name ?? 'Removed roster'
}

function RoundSummary({ league, draft }: { league: League; draft: Draft }) {
  const rounds = Array.from(new Set(draft.picks.map((p) => p.round)))

  return (
    <ul className="list">
      {rounds.map((round) => (
        <li key={round} className="stack">
          <strong>Round {round}</strong>
          <span className="muted">
            {draft.picks
              .filter((p) => p.round === round)
              .map((p) => `${rosterName(league, p.rosterId)}: ${p.name}`)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TeamSummary({ league, draft }: { league: League; draft: Draft }) {
  return (
    <ul className="list">
      {draft.order.map((rosterId) => (
        <li key={rosterId} className="stack">
          <strong>
            {rosterName(league, rosterId)}{' '}
            <span className="muted">
              ({picksFor(draft, rosterId)} picks · {picksFor(draft, rosterId, 'men')} men ·{' '}
              {picksFor(draft, rosterId, 'women')} women)
            </span>
          </strong>
          <span className="muted">
            {draft.picks
              .filter((p) => p.rosterId === rosterId)
              .map((p) => `${p.round}. ${p.name}`)
              .join(' · ') || 'No picks yet.'}
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
  const [menLimit, setMenLimit] = useState('')
  const [womenLimit, setWomenLimit] = useState('')
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
  const available = sortPool(undraftedPool(league, state.pool)).filter(
    (p) => !draft || !onClockId || canDraft(draft, onClockId, p.division),
  )

  const begin = () => {
    const count = Number(rounds)
    if (!Number.isInteger(count) || count < 1) return
    const limits = { men: parseLimit(menLimit), women: parseLimit(womenLimit) }
    if (limits.men !== null && limits.women !== null && limits.men + limits.women < count) {
      alert(`Those limits only allow ${limits.men + limits.women} picks, fewer than the ${count} rounds.`)
      return
    }
    const wrestlers = league.rosters.reduce((n, r) => n + r.wrestlers.length, 0)
    const warning = wrestlers > 0 ? ' This clears every wrestler and champion already on them.' : ''
    if (!confirm(`Draft ${count} wrestlers onto each of the ${league.rosters.length} rosters?${warning}`))
      return
    startDraft(league.id, count, limits)
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
            <label>
              Men per roster{' '}
              <input
                type="number"
                min={0}
                value={menLimit}
                placeholder="No limit"
                onChange={(e) => setMenLimit(e.target.value)}
                style={{ width: '7rem' }}
              />
            </label>
            <label>
              Women per roster{' '}
              <input
                type="number"
                min={0}
                value={womenLimit}
                placeholder="No limit"
                onChange={(e) => setWomenLimit(e.target.value)}
                style={{ width: '7rem' }}
              />
            </label>
            <button onClick={begin}>{draft ? 'Reset rosters and redraft' : 'Start draft'}</button>
          </div>
        )}
        <p className="muted">Leave a limit blank for no limit; 0 blocks that division entirely.</p>
      </div>

      {draft && (
        <div className="card">
          <div className="row spread">
            <h2>{running ? `Round ${currentRound(draft)} of ${draft.rounds}` : 'Draft complete'}</h2>
            <span className="muted">
              {draft.picks.length} of {totalPicks(draft)} picks · started {when(draft.startedAt)}
            </span>
          </div>

          <p className="muted">
            Limits per roster: {draft.limits.men === null ? 'no limit' : draft.limits.men} men ·{' '}
            {draft.limits.women === null ? 'no limit' : draft.limits.women} women
          </p>

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
              {available.length === 0 && (
                <p className="muted">
                  No eligible names left in the pool for this roster — add one below.
                </p>
              )}
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
                <button
                  onClick={draftNewName}
                  disabled={!newName.trim() || !onClockId || !canDraft(draft, onClockId, division)}
                >
                  Add to pool and draft
                </button>
              </div>
            </>
          )}

          <h3>By roster</h3>
          <TeamSummary league={league} draft={draft} />

          <h3>By round</h3>
          {draft.picks.length === 0 ? (
            <p className="muted">No picks yet.</p>
          ) : (
            <RoundSummary league={league} draft={draft} />
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
                  <TeamSummary league={league} draft={old} />
                  <RoundSummary league={league} draft={old} />
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
