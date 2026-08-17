export type Division = 'men' | 'women'

export type MatchType = 'men' | 'women' | 'tag'

export interface Wrestler {
  id: string
  name: string
  division: Division
}

export interface TagTeam {
  id: string
  name: string
  memberIds: string[]
}

export interface ChampionRef {
  rosterId: string
  entrantId: string
}

export interface Champions {
  men: ChampionRef | null
  women: ChampionRef | null
  tag: ChampionRef | null
}

/** One side of a match: a wrestler (singles) or a tag team, plus its home roster. */
export interface Side {
  rosterId: string
  entrantId: string
}

export interface Match {
  id: string
  type: MatchType
  /** When set, the match is for this roster's title in the match's division. */
  titleRosterId: string | null
  sides: Side[]
  winnerIndex: number | null
  summary: string | null
}

export interface Show {
  id: string
  rosterId: string
  name: string
  matches: Match[]
  simulatedAt: string | null
}

export interface Roster {
  id: string
  name: string
  wrestlers: Wrestler[]
  tagTeams: TagTeam[]
  champions: Champions
}

export interface LeagueState {
  rosters: Roster[]
  shows: Show[]
}
