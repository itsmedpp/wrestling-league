import { parseSaveFile } from './saveFile'
import type { LeagueState } from './types'

export const GITHUB_OWNER = 'itsmedpp'
export const GITHUB_REPO = 'wrestling-league'
export const GITHUB_BRANCH = 'main'
export const GITHUB_PATH = 'wrestling-league-roster.json'

const TOKEN_KEY = 'wrestling-league-github-token'

const CONTENTS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`

export const GITHUB_FILE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${GITHUB_PATH}`

export function loadToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function storeToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function githubError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null)
  const message =
    typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : response.statusText
  throw new Error(`GitHub: ${message}`)
}

export async function loadFromGitHub(token: string): Promise<LeagueState> {
  const url = token
    ? `${CONTENTS_URL}?ref=${GITHUB_BRANCH}`
    : `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}?t=${Date.now()}`
  const headers = token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw' }
    : undefined
  const response = await fetch(url, { headers, cache: 'no-store' })
  if (response.status === 404) {
    throw new Error(
      `No ${GITHUB_PATH} on ${GITHUB_BRANCH} (a private repo needs a token to read it too).`,
    )
  }
  if (!response.ok) await githubError(response)
  return parseSaveFile(await response.text())
}

async function currentSha(token: string): Promise<string | undefined> {
  const response = await fetch(`${CONTENTS_URL}?ref=${GITHUB_BRANCH}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  })
  if (response.status === 404) return undefined
  if (!response.ok) await githubError(response)
  const body = (await response.json()) as { sha?: unknown }
  return typeof body.sha === 'string' ? body.sha : undefined
}

export async function saveToGitHub(token: string, state: LeagueState): Promise<void> {
  const sha = await currentSha(token)
  const response = await fetch(CONTENTS_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Update league save file (${state.rosters.length} rosters, ${state.shows.length} shows)`,
      content: encodeBase64(`${JSON.stringify(state, null, 2)}\n`),
      branch: GITHUB_BRANCH,
      sha,
    }),
  })
  if (!response.ok) await githubError(response)
}
