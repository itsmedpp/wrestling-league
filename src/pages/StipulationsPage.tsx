import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeague } from '../store'
import { allStipulations } from '../stipulations'

export default function StipulationsPage() {
  const { state, addStipulation, removeStipulation } = useLeague()
  const [name, setName] = useState('')
  const navigate = useNavigate()

  const stipulations = allStipulations(state)

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addStipulation(trimmed)
    setName('')
  }

  return (
    <div className="page">
      <div className="row">
        <button className="secondary" onClick={() => navigate('/')}>
          Main page
        </button>
      </div>

      <h1>Stipulations</h1>
      <p className="subtitle">Every match on every show picks from this list.</p>

      <div className="card">
        <h2>Add a stipulation</h2>
        <div className="row">
          <input
            value={name}
            placeholder="e.g. Casket Match"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button onClick={add} disabled={!name.trim()}>
            Add stipulation
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{stipulations.length} stipulations</h2>
        {stipulations.length === 0 && (
          <p className="muted">No stipulations left — every match will be a standard match.</p>
        )}
        <ul className="list">
          {stipulations.map((s) => (
            <li key={s}>
              <span>{s}</span>
              <button className="danger" onClick={() => removeStipulation(s)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
