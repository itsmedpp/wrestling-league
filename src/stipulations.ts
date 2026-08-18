import type { LeagueState } from './types'

export const BUILT_IN_STIPULATIONS = [
  'No Disqualification',
  'Steel Cage Match',
  'Hell in a Cell',
  'Ladder Match',
  'Tables Match',
  'TLC Match',
  'Last Man Standing',
  'Submission Match',
  'Iron Man Match',
  'Falls Count Anywhere',
  'Street Fight',
  'Battle Royal',
  'Royal Rumble',
]

export function allStipulations(state: LeagueState): string[] {
  return [...BUILT_IN_STIPULATIONS, ...state.stipulations]
}
