import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { championName, leagueOfRoster, sortWrestlers } from '../lookup'
import { sortPool } from '../pool'
import LogoPicker from '../LogoPicker'
import type { Champions, Division } from '../types'

export default function RosterPage() {
  const { rosterId = '' } = useParams()
  const navigate = useNavigate()
  const {
    state,
    renameRoster,
    setRosterOwner,
    setRosterLogo,
    addWrestler,
    updateWrestler,
    removeWrestler,
    setChampion,
    addShow,
    deleteShow,
  } = useLeague()

  const league = leagueOfRoster(state, rosterId)
  const roster = league?.rosters.find((r) => r.id === rosterId)
  const [poolId, setPoolId] = useState('')
  const [showName, setShowName] = useState('')

  if (!league || !roster) {
    return (
      <div className="page">
        <h1>Roster not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const shows = league.shows.filter((s) => s.rosterId === roster.id)

  const taken = new Set(roster.wrestlers.map((w) => w.name.toLowerCase()))
  const available = sortPool(state.pool).filter((p) => !taken.has(p.name.toLowerCase()))

  const create = () => {
    const pick = state.pool.find((p) => p.id === poolId)
    if (!pick) return
    addWrestler(roster.id, pick.name, pick.division)
    setPoolId('')
  }

  const createShow = () => {
    const trimmed = showName.trim() || 'New Show'
    const show = addShow(roster.id, trimmed)
    setShowName('')
    navigate(`/show/${show.id}`)
  }

  const titleRow = (title: keyof Champions, label: string) => {
    const options = sortWrestlers(
      title === 'tag' ? roster.wrestlers : roster.wrestlers.filter((w) => w.division === title),
    )
    const held = roster.champions[title]?.entrantIds ?? []
    const slots = title === 'tag' ? [0, 1] : [0]
    const setSlot = (slot: number, id: string) => {
      const next = [...held]
      next[slot] = id
      setChampion(roster.id, title, next)
    }
    return (
      <div className="row" key={title}>
        <span className="title-badge">{label}</span>
        <strong>{championName(league, roster.champions[title])}</strong>
        {slots.map((slot) => (
          <select key={slot} value={held[slot] ?? ''} onChange={(e) => setSlot(slot, e.target.value)}>
            <option value="">Vacant</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ))}
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
      </div>

      <div className="row page-header">
        {roster.logo && <img className="logo logo-large" src={roster.logo} alt={`${roster.name} logo`} />}
        <div className="grow">
          <input
            className="page-title"
            value={roster.name}
            aria-label="Roster name"
            onChange={(e) => renameRoster(roster.id, e.target.value)}
          />
          <input
            className="page-subtitle"
            value={roster.owner}
            aria-label="Roster owner"
            placeholder="Who runs this brand?"
            onChange={(e) => setRosterOwner(roster.id, e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h2>Roster logo</h2>
        <LogoPicker
          logo={roster.logo}
          alt={`${roster.name} logo`}
          onChange={(logo) => setRosterLogo(roster.id, logo)}
        />
      </div>

      <div className="card">
        <h2>Champions</h2>
        {titleRow('men', "Men's")}
        {titleRow('women', "Women's")}
        {titleRow('tag', 'Tag Team')}
        <p className="muted">
          Each roster keeps its own titles; simulating a title match on a show moves them. The tag titles are
          held by any two names from this roster.
        </p>
      </div>

      <div className="card">
        <h2>Wrestlers</h2>
        <div className="row">
          <select value={poolId} onChange={(e) => setPoolId(e.target.value)}>
            <option value="">Pick from the roster pool…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.promotion || 'Unaffiliated'} · {p.division === 'men' ? "Men's" : "Women's"}
              </option>
            ))}
          </select>
          <button onClick={create} disabled={!poolId}>
            Add
          </button>
          <button className="secondary" onClick={() => navigate('/pool')}>
            Manage pool
          </button>
        </div>
        <ul className="list">
          {sortWrestlers(roster.wrestlers).map((w) => (
            <li key={w.id}>
              <input value={w.name} onChange={(e) => updateWrestler(roster.id, w.id, e.target.value, w.division)} />
              <select
                value={w.division}
                onChange={(e) => updateWrestler(roster.id, w.id, w.name, e.target.value as Division)}
              >
                <option value="men">Men's</option>
                <option value="women">Women's</option>
              </select>
              <button className="danger" onClick={() => removeWrestler(roster.id, w.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        {roster.wrestlers.length === 0 && <p className="muted">No wrestlers yet.</p>}
      </div>

      <div className="card">
        <h2>Shows</h2>
        <div className="row">
          <input
            value={showName}
            placeholder="Show name"
            onChange={(e) => setShowName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createShow()}
          />
          <button onClick={createShow}>Create show</button>
        </div>
        <ul className="list">
          {shows.map((show) => (
            <li key={show.id}>
              <div>
                <button className="link-button" onClick={() => navigate(`/show/${show.id}`)}>
                  {show.name}
                </button>
                <div className="muted">
                  {show.matches.length} matches ·{' '}
                  {show.simulatedAt
                    ? `simulated ${new Date(show.simulatedAt).toLocaleString()}`
                    : 'not simulated'}
                </div>
              </div>
              <button className="danger" onClick={() => confirm(`Delete "${show.name}"?`) && deleteShow(show.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        {shows.length === 0 && <p className="muted">No shows yet.</p>}
      </div>
    </div>
  )
}
