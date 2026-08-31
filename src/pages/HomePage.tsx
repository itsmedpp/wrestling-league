import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeague } from '../store'
import {
  GITHUB_FILE_URL,
  GITHUB_PATH,
  loadFromGitHub,
  loadToken,
  saveToGitHub,
  storeToken,
} from '../github'

export default function HomePage() {
  const { state, addLeague, deleteLeague, replaceState } = useLeague()
  const [name, setName] = useState('')
  const [token, setToken] = useState(loadToken)
  const [githubMessage, setGithubMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const league = addLeague(trimmed)
    setName('')
    navigate(`/league/${league.id}`)
  }

  const remove = (leagueId: string, leagueName: string) => {
    if (!confirm(`Delete "${leagueName}" and all of its rosters and shows?`)) return
    deleteLeague(leagueId)
  }

  const pullFromGitHub = async () => {
    setBusy(true)
    setGithubMessage('')
    try {
      const remote = await loadFromGitHub(token)
      const rosters = remote.leagues.reduce((n, l) => n + l.rosters.length, 0)
      const counts = `${remote.leagues.length} leagues and ${rosters} rosters`
      if (confirm(`Replace everything currently saved with ${counts} from GitHub?`)) {
        replaceState(remote)
        setGithubMessage(`Loaded ${counts} from GitHub.`)
      }
    } catch (error) {
      setGithubMessage(error instanceof Error ? error.message : 'Could not load from GitHub.')
    } finally {
      setBusy(false)
    }
  }

  const pushToGitHub = async () => {
    setBusy(true)
    setGithubMessage('')
    try {
      await saveToGitHub(token, state)
      setGithubMessage(`Saved ${GITHUB_PATH} to GitHub.`)
    } catch (error) {
      setGithubMessage(error instanceof Error ? error.message : 'Could not save to GitHub.')
    } finally {
      setBusy(false)
    }
  }

  const updateToken = (next: string) => {
    setToken(next)
    storeToken(next)
  }

  return (
    <div className="page">
      <h1>Wrestling League Simulator</h1>
      <p className="subtitle">Build rosters, book shows, and let the matches decide your champions.</p>

      <div className="card">
        <h2>Leagues</h2>
        {state.leagues.length === 0 && <p className="muted">No leagues yet. Create one below.</p>}
        <ul className="list">
          {state.leagues.map((league) => (
            <li key={league.id}>
              <div className="row">
                {league.logo && <img className="logo" src={league.logo} alt={`${league.name} logo`} />}
                <div>
                  <button className="link-button" onClick={() => navigate(`/league/${league.id}`)}>
                    {league.name}
                  </button>
                  <div className="muted">
                    {league.rosters.length} rosters · {league.shows.length} shows
                  </div>
                </div>
              </div>
              <button className="danger" onClick={() => remove(league.id, league.name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Create a new league</h2>
        <div className="row">
          <input
            value={name}
            placeholder="League name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button onClick={create} disabled={!name.trim()}>
            Add league
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Roster pool</h2>
        <p className="muted">
          {state.pool.length} names league rosters can draw from, seeded from the WWE, NXT, AEW, and TNA
          rosters.
        </p>
        <button className="secondary" onClick={() => navigate('/pool')}>
          Manage roster pool
        </button>
      </div>

      <div className="card">
        <h2>Stipulations</h2>
        <p className="muted">
          {state.stipulationList.length} match stipulations are available when booking a show.
        </p>
        <button className="secondary" onClick={() => navigate('/stipulations')}>
          Manage stipulations
        </button>
      </div>

      <div className="card">
        <h2>GitHub sync</h2>
        <p className="muted">
          Shares every league through <a href={GITHUB_FILE_URL}>{GITHUB_PATH}</a> in the repo. Saving needs a
          GitHub token with write access, kept in this browser only; loading needs one too while the repo
          is private.
        </p>
        <div className="row">
          <input
            type="password"
            value={token}
            placeholder="GitHub token (for saving)"
            onChange={(e) => updateToken(e.target.value.trim())}
          />
          <button onClick={() => updateToken('')} disabled={!token}>
            Forget token
          </button>
        </div>
        <div className="row">
          <button onClick={() => void pullFromGitHub()} disabled={busy}>
            Load from GitHub
          </button>
          <button onClick={() => void pushToGitHub()} disabled={busy || !token}>
            Save to GitHub
          </button>
        </div>
        {githubMessage && <p className="muted">{githubMessage}</p>}
      </div>
    </div>
  )
}
