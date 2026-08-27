import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeague } from '../store'
import { poolPromotions, PROMOTIONS, sortPool } from '../pool'
import type { Division } from '../types'

export default function PoolPage() {
  const { state, addPoolWrestler, removePoolWrestler } = useLeague()
  const [name, setName] = useState('')
  const [promotion, setPromotion] = useState<string>(PROMOTIONS[0])
  const [division, setDivision] = useState<Division>('men')
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addPoolWrestler(trimmed, promotion, division)
    setName('')
  }

  const shown = sortPool(state.pool).filter((p) => p.promotion === filter || !filter)

  return (
    <div className="page">
      <div className="nav">
        <button className="secondary" onClick={() => navigate('/')}>
          ← Main page
        </button>
      </div>

      <h1>Roster Pool</h1>
      <p className="subtitle">
        Every name league rosters can draw from, seeded from the WWE, NXT, AEW, and TNA rosters.
      </p>

      <div className="card">
        <h2>Add a name</h2>
        <div className="row">
          <input
            value={name}
            placeholder="Wrestler name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
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
          <button onClick={add} disabled={!name.trim()}>
            Add to pool
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row spread">
          <h2>{shown.length} names</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All promotions</option>
            {poolPromotions(state).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {shown.length === 0 && <p className="muted">No names in the pool yet.</p>}
        <ul className="list">
          {shown.map((p) => (
            <li key={p.id}>
              <span>
                {p.name}
                <span className="muted">
                  {' '}
                  · {p.promotion || 'Unaffiliated'} · {p.division === 'men' ? "Men's" : "Women's"}
                </span>
              </span>
              <button className="danger" onClick={() => removePoolWrestler(p.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
