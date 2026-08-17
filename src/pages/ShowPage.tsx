import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { sideLabel } from '../simulate'
import { championName } from '../lookup'
import type { Match, MatchType, Roster, Side } from '../types'

const TYPE_LABEL: Record<MatchType, string> = {
  men: "Men's singles",
  women: "Women's singles",
  tag: 'Tag team',
}

function entrantOptions(roster: Roster, type: MatchType) {
  return type === 'tag' ? roster.wrestlers : roster.wrestlers.filter((w) => w.division === type)
}

export default function ShowPage() {
  const { showId = '' } = useParams()
  const navigate = useNavigate()
  const { state, renameShow, addMatch, updateMatch, removeMatch, setMatchSide, addMatchSide, removeMatchSide, simulate } =
    useLeague()

  const show = state.shows.find((s) => s.id === showId)

  if (!show) {
    return (
      <div className="page">
        <h1>Show not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const homeRoster = state.rosters.find((r) => r.id === show.rosterId)

  if (!homeRoster) {
    return (
      <div className="page">
        <h1>Roster not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const roster = homeRoster
  const filledSides = (match: Match) =>
    match.sides.filter((s) => s.entrantIds.filter(Boolean).length >= (match.type === 'tag' ? 2 : 1)).length
  const bookable = show.matches.some((m) => filledSides(m) >= 2)

  const renderMatch = (match: Match, index: number) => {
    const entrants = entrantOptions(roster, match.type)
    const slots = match.type === 'tag' ? [0, 1] : [0]
    const emptySide: Side = { rosterId: roster.id, entrantIds: [] }
    const sides = match.sides.length >= 2 ? match.sides : [...match.sides, ...Array(2 - match.sides.length).fill(emptySide)]

    return (
      <div className="card" key={match.id}>
        <div className="row spread">
          <h3>
            Match {index + 1} · {TYPE_LABEL[match.type]}
          </h3>
          <button className="danger" onClick={() => removeMatch(show.id, match.id)}>
            Remove match
          </button>
        </div>

        <div className="row">
          <label className="muted">Match type</label>
          <select
            value={match.type}
            onChange={(e) =>
              updateMatch(show.id, match.id, {
                type: e.target.value as MatchType,
                sides: [],
                winnerIndex: null,
                summary: null,
                titleRosterId: null,
              })
            }
          >
            {(Object.keys(TYPE_LABEL) as MatchType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>

          <label className="muted">
            <input
              type="checkbox"
              checked={match.titleRosterId !== null}
              onChange={(e) => updateMatch(show.id, match.id, { titleRosterId: e.target.checked ? roster.id : null })}
            />{' '}
            Title match
          </label>
        </div>

        {sides.map((side, i) => (
          <div className="row" key={i}>
            {slots.map((slot) => (
              <select
                key={slot}
                value={side.entrantIds[slot] ?? ''}
                onChange={(e) => {
                  const entrantIds = [...side.entrantIds]
                  entrantIds[slot] = e.target.value
                  setMatchSide(show.id, match.id, i, { rosterId: roster.id, entrantIds })
                }}
              >
                <option value="">Select competitor…</option>
                {entrants.map((entrant) => (
                  <option key={entrant.id} value={entrant.id}>
                    {entrant.name}
                  </option>
                ))}
              </select>
            ))}
            {match.winnerIndex === i && <span className="winner">Winner</span>}
            {sides.length > 2 && (
              <button className="secondary" onClick={() => removeMatchSide(show.id, match.id, i)}>
                Remove side
              </button>
            )}
          </div>
        ))}

        <div className="row">
          <button className="secondary" onClick={() => addMatchSide(show.id, match.id)}>
            {match.type === 'tag' ? 'Add team' : 'Add competitor'}
          </button>
        </div>

        {match.summary && <p className="winner">{match.summary}</p>}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav">
        <button className="secondary" onClick={() => navigate('/')}>
          ← Main page
        </button>
        {homeRoster && (
          <button className="secondary" onClick={() => navigate(`/roster/${homeRoster.id}`)}>
            ← {homeRoster.name}
          </button>
        )}
      </div>

      <div className="card">
        <h2>Show name</h2>
        <input value={show.name} onChange={(e) => renameShow(show.id, e.target.value)} />
      </div>

      <div className="card">
        <h2>Card</h2>
        <div className="row">
          {(Object.keys(TYPE_LABEL) as MatchType[]).map((t) => (
            <button key={t} className="secondary" onClick={() => addMatch(show.id, t)}>
              Add {TYPE_LABEL[t].toLowerCase()} match
            </button>
          ))}
        </div>
        {show.matches.length === 0 && <p className="muted">No matches booked yet.</p>}
      </div>

      {show.matches.map(renderMatch)}

      <div className="card">
        <button onClick={() => simulate(show.id)} disabled={!bookable}>
          Simulate show
        </button>
        {show.simulatedAt && (
          <p className="muted">Last simulated {new Date(show.simulatedAt).toLocaleString()}</p>
        )}
      </div>

      {show.simulatedAt && (
        <div className="card">
          <h2>Results</h2>
          <ul className="list">
            {show.matches.map((match, i) => (
              <li key={match.id}>
                <span>
                  <strong>Match {i + 1}:</strong>{' '}
                  {match.sides.map((s) => sideLabel(state, s)).join(' vs ') || 'No competitors'}
                  <div className="muted">{match.summary ?? 'Not simulated'}</div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>{roster.name} champions</h2>
        <p className="muted">
          Men's: {championName(state, roster.champions.men)} · Women's: {championName(state, roster.champions.women)} ·
          Tag Team: {championName(state, roster.champions.tag)}
        </p>
      </div>
    </div>
  )
}
