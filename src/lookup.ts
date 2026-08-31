import type { ChampionRef, League, LeagueState, Side, Wrestler } from './types'
import { sideLabel } from './simulate'

/** Men's division first, then women's, alphabetical within each. */
export function sortWrestlers(wrestlers: Wrestler[]): Wrestler[] {
  return [...wrestlers].sort(
    (a, b) =>
      (a.division === b.division ? 0 : a.division === 'men' ? -1 : 1) || a.name.localeCompare(b.name),
  )
}

export function championName(league: League, ref: ChampionRef | null): string {
  if (!ref) return 'Vacant'
  return sideLabel(league, ref as Side)
}

export function leagueOfRoster(state: LeagueState, rosterId: string): League | undefined {
  return state.leagues.find((l) => l.rosters.some((r) => r.id === rosterId))
}

export function leagueOfShow(state: LeagueState, showId: string): League | undefined {
  return state.leagues.find((l) => l.shows.some((s) => s.id === showId))
}
