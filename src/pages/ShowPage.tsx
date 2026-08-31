import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { championInMatch, RATINGS, sideLabel, SIDE_SIZE, starLabel, titleKey } from '../simulate'
import { championName, leagueOfShow, sortWrestlers } from '../lookup'
import { allStipulations, sortStipulations } from '../stipulations'
import type { Match, MatchType, Roster, Side } from '../types'

const TYPE_LABEL: Record<MatchType, string> = {
  men: "Men's singles",
  women: "Women's singles",
  tag: 'Tag team',
  tag6: '6-man tag',
  tag8: '8-man tag',
}

function entrantOptions(roster: Roster, type: MatchType) {
  return sortWrestlers(
    type === 'men' || type === 'women'
      ? roster.wrestlers.filter((w) => w.division === type)
      : roster.wrestlers,
  )
}

export default function ShowPage() {
  const { showId = '' } = useParams()
  const navigate = useNavigate()
  const {
    state,
    renameShow,
    addMatch,
    updateMatch,
    removeMatch,
    setMatchSide,
    addMatchSide,
    removeMatchSide,
    moveMatch,
    setMainEvent,
    simulate,
  } = useLeague()

  const league = leagueOfShow(state, showId)
  const show = league?.shows.find((s) => s.id === showId)

  if (!league || !show) {
    return (
      <div className="page">
        <h1>Show not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const homeRoster = league.rosters.find((r) => r.id === show.rosterId)

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
    match.sides.filter((s) => s.entrantIds.filter(Boolean).length >= SIDE_SIZE[match.type]).length
  const bookable = show.matches.some((m) => filledSides(m) >= 2)

  const stipulations = allStipulations(state)

  const titleWarning = (match: Match, sides: Side[]) => {
    const key = titleKey(match.type)
    if (!key) return null
    const champion = roster.champions[key]
    if (!champion) return <span className="muted">Vacant title — the winner claims it on a pinfall or submission.</span>
    if (championInMatch(champion, sides)) return null
    return (
      <span className="muted">
        {championName(league, champion)} is not in this match, so the title stays with them.
      </span>
    )
  }

  const renderMatch = (match: Match, index: number) => {
    const entrants = entrantOptions(roster, match.type)
    const stipulationOptions =
      match.stipulation && !stipulations.includes(match.stipulation)
        ? sortStipulations([...stipulations, match.stipulation])
        : stipulations
    const slots = Array.from({ length: SIDE_SIZE[match.type] }, (_, slot) => slot)
    const emptySide: Side = { rosterId: roster.id, entrantIds: [] }
    const sides = match.sides.length >= 2 ? match.sides : [...match.sides, ...Array(2 - match.sides.length).fill(emptySide)]

    return (
      <div className="card" key={match.id}>
        <div className="row spread">
          <h3>
            Match {index + 1} · {TYPE_LABEL[match.type]}
            {match.stipulation && ` · ${match.stipulation}`}
            {show.mainEventId === match.id && ' · Main event'}
          </h3>
          <div className="row">
            <button
              className="secondary"
              aria-label="Move match up"
              disabled={index === 0}
              onClick={() => moveMatch(show.id, match.id, -1)}
            >
              ↑
            </button>
            <button
              className="secondary"
              aria-label="Move match down"
              disabled={index === show.matches.length - 1}
              onClick={() => moveMatch(show.id, match.id, 1)}
            >
              ↓
            </button>
            <button className="danger" onClick={() => removeMatch(show.id, match.id)}>
              Remove match
            </button>
          </div>
        </div>

        <div className="row">
          <label className="muted">
            <input
              type="checkbox"
              checked={show.mainEventId === match.id}
              onChange={(e) => setMainEvent(show.id, e.target.checked ? match.id : null)}
            />{' '}
            Main event
          </label>
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

          {titleKey(match.type) ? (
            <>
              <label className="muted">
                <input
                  type="checkbox"
                  checked={match.titleRosterId !== null}
                  onChange={(e) =>
                    updateMatch(show.id, match.id, { titleRosterId: e.target.checked ? roster.id : null })
                  }
                />{' '}
                Title match
              </label>
              {match.titleRosterId && titleWarning(match, sides)}
            </>
          ) : (
            <span className="muted">{TYPE_LABEL[match.type]} matches are non-title.</span>
          )}
        </div>

        <div className="row">
          <label className="muted">Stipulation</label>
          <select
            value={match.stipulation}
            onChange={(e) => updateMatch(show.id, match.id, { stipulation: e.target.value })}
          >
            <option value="">Standard Match</option>
            {stipulationOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
            {SIDE_SIZE[match.type] > 1 ? 'Add team' : 'Add competitor'}
          </button>
        </div>

        {match.summary && (
          <>
            <div className="row">
              <label className="muted">Star rating</label>
              <select
                value={match.rating ?? ''}
                onChange={(e) =>
                  updateMatch(show.id, match.id, {
                    rating: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Unrated</option>
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {starLabel(r)} ({r.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
            <p className="winner">{match.summary}</p>
          </>
        )}
      </div>
    )
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
        {homeRoster && (
          <button className="secondary" onClick={() => navigate(`/roster/${homeRoster.id}`)}>
            ← {homeRoster.name}
          </button>
        )}
      </div>

      <input
        className="page-title"
        value={show.name}
        aria-label="Show name"
        onChange={(e) => renameShow(show.id, e.target.value)}
      />
      <div className="row page-header">
        {roster.logo && <img className="logo" src={roster.logo} alt={`${roster.name} logo`} />}
        <div>
          <strong>{roster.name}</strong>
          {roster.owner && <div className="muted">Owner: {roster.owner}</div>}
        </div>
      </div>

      {show.matches.map(renderMatch)}

      <div className="card">
        <button onClick={() => addMatch(show.id, 'men')}>Add match</button>
        {show.matches.length === 0 && <p className="muted">No matches booked yet.</p>}
      </div>

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
                  <strong>
                    {show.mainEventId === match.id ? 'Main event' : `Match ${i + 1}`}:
                  </strong>{' '}
                  {match.sides.map((s) => sideLabel(league, s)).join(' vs ') || 'No competitors'}
                  {match.rating !== null && (
                    <span className="stars" title={`${match.rating.toFixed(1)} stars`}>
                      {' '}
                      {starLabel(match.rating)}
                    </span>
                  )}
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
          Men's: {championName(league, roster.champions.men)} · Women's:{' '}
          {championName(league, roster.champions.women)} · Tag Team: {championName(league, roster.champions.tag)}
        </p>
      </div>
    </div>
  )
}
