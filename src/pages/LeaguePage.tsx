import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { championName } from '../lookup'
import LogoPicker from '../LogoPicker'

export default function LeaguePage() {
  const { leagueId = '' } = useParams()
  const navigate = useNavigate()
  const { state, renameLeague, setLeagueLogo, addRoster, deleteRoster } = useLeague()
  const [name, setName] = useState('')

  const league = state.leagues.find((l) => l.id === leagueId)

  if (!league) {
    return (
      <div className="page">
        <h1>League not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const roster = addRoster(league.id, trimmed)
    setName('')
    navigate(`/roster/${roster.id}`)
  }

  const remove = (rosterId: string, rosterName: string) => {
    if (!confirm(`Delete "${rosterName}" and all of its shows?`)) return
    deleteRoster(rosterId)
  }

  return (
    <div className="page">
      <div className="nav">
        <button className="secondary" onClick={() => navigate('/')}>
          ← Main page
        </button>
      </div>

      <div className="row page-header">
        {league.logo && <img className="logo logo-large" src={league.logo} alt={`${league.name} logo`} />}
        <div className="grow">
          <input
            className="page-title"
            value={league.name}
            aria-label="League name"
            onChange={(e) => renameLeague(league.id, e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h2>Rosters</h2>
        {league.rosters.length === 0 && <p className="muted">No rosters yet. Create one below.</p>}
        <ul className="list">
          {league.rosters.map((roster) => (
            <li key={roster.id}>
              <div className="row">
                {roster.logo && <img className="logo" src={roster.logo} alt={`${roster.name} logo`} />}
                <div>
                  <button className="link-button" onClick={() => navigate(`/roster/${roster.id}`)}>
                    {roster.name}
                  </button>
                  <div className="muted">
                    {roster.owner && `Owner: ${roster.owner} · `}
                    {roster.wrestlers.length} wrestlers · Men: {championName(league, roster.champions.men)} ·
                    Women: {championName(league, roster.champions.women)} · Tag:{' '}
                    {championName(league, roster.champions.tag)}
                  </div>
                </div>
              </div>
              <button className="danger" onClick={() => remove(roster.id, roster.name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Draft</h2>
        <p className="muted">
          {league.draft
            ? `Last draft: ${league.draft.picks.length} picks over ${league.draft.rounds} rounds.`
            : 'Stock this league’s rosters with a snake draft from the roster pool.'}
        </p>
        <button onClick={() => navigate(`/league/${league.id}/draft`)}>Open the draft</button>
      </div>

      <div className="card">
        <h2>Create a roster</h2>
        <div className="row">
          <input
            value={name}
            placeholder="Roster name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button onClick={create} disabled={!name.trim()}>
            Add roster
          </button>
        </div>
      </div>

      <div className="card">
        <h2>League logo</h2>
        <LogoPicker
          logo={league.logo}
          alt={`${league.name} logo`}
          onChange={(logo) => setLeagueLogo(league.id, logo)}
        />
      </div>
    </div>
  )
}
