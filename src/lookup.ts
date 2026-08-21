import type { ChampionRef, LeagueState, Side, Wrestler } from './types'
import { sideLabel } from './simulate'

/** Men's division first, then women's, alphabetical within each. */
export function sortWrestlers(wrestlers: Wrestler[]): Wrestler[] {
  return [...wrestlers].sort(
    (a, b) =>
      (a.division === b.division ? 0 : a.division === 'men' ? -1 : 1) || a.name.localeCompare(b.name),
  )
}

export function championName(state: LeagueState, ref: ChampionRef | null): string {
  if (!ref) return 'Vacant'
  return sideLabel(state, ref as Side)
}
