import type { ChampionRef, LeagueState, Side } from './types'
import { sideLabel } from './simulate'

export function championName(state: LeagueState, ref: ChampionRef | null): string {
  if (!ref) return 'Vacant'
  return sideLabel(state, ref as Side)
}
