import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeague } from '../store'
import { championName } from '../lookup'
import {
  GITHUB_FILE_URL,
  GITHUB_PATH,
  loadFromGitHub,
  loadToken,
  saveToGitHub,
  storeToken,
} from '../github'

export default function HomePage() {
  const { state, addRoster, deleteRoster, replaceState } = useLeague()
  const [name, setName] = useState('')
  const [token, setToken] = useState(loadToken)
  const [githubMessage, setGithubMessage] = useState('')
  const [busy, setBusy] = useState(false)
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
    deleteRoster(rosterId)
  }

  const pullFromGitHub = async () => {
    setBusy(true)
    setGithubMessage('')
    try {
      const remote = await loadFromGitHub(token)
      const counts = `${remote.rosters.length} rosters and ${remote.shows.length} shows`
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
                  {roster.owner && `Owner: ${roster.owner} · `}
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

      <div className="card">
        <h2>GitHub sync</h2>
        <p className="muted">
          Shares one league through <a href={GITHUB_FILE_URL}>{GITHUB_PATH}</a> in the repo. Saving needs a
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
