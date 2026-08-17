import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeague } from '../store'
import { championName } from '../lookup'

export default function HomePage() {
  const { state, addRoster, deleteRoster } = useLeague()
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const navigate = useNavigate()

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const roster = addRoster(trimmed)
    setName('')
    navigate(`/roster/${roster.id}`)
  }

  const remove = (rosterId: string, rosterName: string) => {
    if (!confirm(`Delete "${rosterName}" and all of its shows?`)) return
    if (selectedId === rosterId) setSelectedId('')
    deleteRoster(rosterId)
  }

  return (
    <div className="page">
      <h1>Wrestling League Simulator</h1>
      <p className="subtitle">Build rosters, book shows, and let the matches decide your champions.</p>

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
        <h2>Open a roster</h2>
        <div className="row">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select a roster…</option>
            {state.rosters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button onClick={() => navigate(`/roster/${selectedId}`)} disabled={!selectedId}>
            View roster
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Rosters</h2>
        {state.rosters.length === 0 && <p className="muted">No rosters yet. Create one above.</p>}
        <ul className="list">
          {state.rosters.map((roster) => (
            <li key={roster.id}>
              <div>
                <button className="link-button" onClick={() => navigate(`/roster/${roster.id}`)}>
                  {roster.name}
                </button>
                <div className="muted">
                  {roster.wrestlers.length} wrestlers · Men: {championName(state, roster.champions.men)} · Women:{' '}
                  {championName(state, roster.champions.women)} · Tag: {championName(state, roster.champions.tag)}
                </div>
              </div>
              <button className="danger" onClick={() => remove(roster.id, roster.name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
