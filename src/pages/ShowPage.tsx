import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { sideLabel } from '../simulate'
import type { LeagueState, Match, MatchType, Side } from '../types'

const TYPE_LABEL: Record<MatchType, string> = {
  men: "Men's singles",
  women: "Women's singles",
  tag: 'Tag team',
}

function entrantOptions(state: LeagueState, type: MatchType) {
  return state.rosters.map((roster) => ({
    roster,
    entrants:
      type === 'tag'
        ? roster.tagTeams.map((t) => ({ id: t.id, name: t.name }))
        : roster.wrestlers.filter((w) => w.division === type).map((w) => ({ id: w.id, name: w.name })),
  }))
}

function encodeSide(side: Side): string {
  return side.entrantId ? `${side.rosterId}:${side.entrantId}` : ''
}

function decodeSide(value: string): Side {
  const [rosterId, entrantId] = value.split(':')
  return { rosterId, entrantId }
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
  const bookable = show.matches.some((m) => m.sides.filter((s) => s.entrantId).length >= 2)

  const renderMatch = (match: Match, index: number) => {
    const groups = entrantOptions(state, match.type)
    const sides = match.sides.length >= 2 ? match.sides : [...match.sides, ...Array(2 - match.sides.length).fill({ rosterId: '', entrantId: '' })]

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

          <label className="muted">Title on the line</label>
          <select
            value={match.titleRosterId ?? ''}
            onChange={(e) => updateMatch(show.id, match.id, { titleRosterId: e.target.value || null })}
          >
            <option value="">Non-title</option>
            {state.rosters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {TYPE_LABEL[match.type]} title
              </option>
            ))}
          </select>
        </div>

        {sides.map((side, i) => (
          <div className="row" key={i}>
            <select
              value={encodeSide(side)}
              onChange={(e) => setMatchSide(show.id, match.id, i, decodeSide(e.target.value))}
            >
              <option value="">Select competitor…</option>
              {groups.map((group) => (
                <optgroup key={group.roster.id} label={group.roster.name}>
                  {group.entrants.map((entrant) => (
                    <option key={entrant.id} value={`${group.roster.id}:${entrant.id}`}>
                      {entrant.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
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
            Add competitor
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

      {state.rosters.length > 0 && (
        <div className="card">
          <h2>Current champions</h2>
          <ul className="list">
            {state.rosters.map((r) => (
              <li key={r.id}>
                <span>
                  <strong>{r.name}</strong>
                  <div className="muted">
                    Men: {r.champions.men ? sideLabel(state, r.champions.men) : 'Vacant'} · Women:{' '}
                    {r.champions.women ? sideLabel(state, r.champions.women) : 'Vacant'} · Tag:{' '}
                    {r.champions.tag ? sideLabel(state, r.champions.tag) : 'Vacant'}
                  </div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
