import type { LeagueState } from './types'

export function downloadSaveFile(state: LeagueState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wrestling-league-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function parseSaveFile(text: string): LeagueState {
  const parsed: unknown = JSON.parse(text)
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as LeagueState).rosters) ||
    !Array.isArray((parsed as LeagueState).shows)
  ) {
    throw new Error('That file is not a wrestling league save file.')
  }
  const state = parsed as LeagueState
  return { rosters: state.rosters, shows: state.shows }
}
