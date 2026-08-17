import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLeague } from '../store'
import { championName } from '../lookup'
import type { Champions, Division } from '../types'

export default function RosterPage() {
  const { rosterId = '' } = useParams()
  const navigate = useNavigate()
  const {
    state,
    renameRoster,
    addWrestler,
    updateWrestler,
    removeWrestler,
    addTagTeam,
    removeTagTeam,
    setChampion,
    addShow,
    deleteShow,
  } = useLeague()

  const roster = state.rosters.find((r) => r.id === rosterId)
  const [wrestlerName, setWrestlerName] = useState('')
  const [division, setDivision] = useState<Division>('men')
  const [teamName, setTeamName] = useState('')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [showName, setShowName] = useState('')

  if (!roster) {
    return (
      <div className="page">
        <h1>Roster not found</h1>
        <button onClick={() => navigate('/')}>Back to main page</button>
      </div>
    )
  }

  const shows = state.shows.filter((s) => s.rosterId === roster.id)

  const create = () => {
    const trimmed = wrestlerName.trim()
    if (!trimmed) return
    addWrestler(roster.id, trimmed, division)
    setWrestlerName('')
  }

  const createTeam = () => {
    const trimmed = teamName.trim()
    if (!trimmed || teamMembers.length !== 2) return
    addTagTeam(roster.id, trimmed, teamMembers)
    setTeamName('')
    setTeamMembers([])
  }

  const createShow = () => {
    const trimmed = showName.trim() || 'New Show'
    const show = addShow(roster.id, trimmed)
    setShowName('')
    navigate(`/show/${show.id}`)
  }

  const titleRow = (title: keyof Champions, label: string) => {
    const options =
      title === 'tag'
        ? roster.tagTeams.map((t) => ({ id: t.id, name: t.name }))
        : roster.wrestlers.filter((w) => w.division === title).map((w) => ({ id: w.id, name: w.name }))
    const current = roster.champions[title]
    const value = current && current.rosterId === roster.id ? current.entrantId : ''
    return (
      <div className="row" key={title}>
        <span className="title-badge">{label}</span>
        <strong>{championName(state, current)}</strong>
        <select value={value} onChange={(e) => setChampion(roster.id, title, e.target.value || null)}>
          <option value="">Vacant</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav">
        <button className="secondary" onClick={() => navigate('/')}>
          ← Main page
        </button>
      </div>

      <div className="card">
        <h2>Roster name</h2>
        <input value={roster.name} onChange={(e) => renameRoster(roster.id, e.target.value)} />
      </div>

      <div className="card">
        <h2>Champions</h2>
        {titleRow('men', "Men's")}
        {titleRow('women', "Women's")}
        {titleRow('tag', 'Tag Team')}
        <p className="muted">Champions from another roster can only be changed by simulating a title match.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Wrestlers</h2>
          <div className="row">
            <input
              value={wrestlerName}
              placeholder="Wrestler name"
              onChange={(e) => setWrestlerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
            <select value={division} onChange={(e) => setDivision(e.target.value as Division)}>
              <option value="men">Men's</option>
              <option value="women">Women's</option>
            </select>
            <button onClick={create} disabled={!wrestlerName.trim()}>
              Add
            </button>
          </div>
          <ul className="list">
            {roster.wrestlers.map((w) => (
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
          <h2>Tag teams</h2>
          <div className="row">
            <input value={teamName} placeholder="Team name" onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div className="row">
            <select
              multiple
              size={4}
              value={teamMembers}
              onChange={(e) =>
                setTeamMembers(Array.from(e.target.selectedOptions, (o) => o.value).slice(0, 2))
              }
            >
              {roster.wrestlers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button onClick={createTeam} disabled={!teamName.trim() || teamMembers.length !== 2}>
              Add team
            </button>
          </div>
          <p className="muted">Select exactly two wrestlers (ctrl-click for the second).</p>
          <ul className="list">
            {roster.tagTeams.map((t) => (
              <li key={t.id}>
                <span>
                  {t.name}
                  <span className="muted">
                    {' '}
                    (
                    {t.memberIds
                      .map((id) => roster.wrestlers.find((w) => w.id === id)?.name ?? '?')
                      .join(' & ')}
                    )
                  </span>
                </span>
                <button className="danger" onClick={() => removeTagTeam(roster.id, t.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {roster.tagTeams.length === 0 && <p className="muted">No tag teams yet.</p>}
        </div>
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
                  {show.matches.length} matches · {show.simulatedAt ? 'simulated' : 'not simulated'}
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
