export type Division = 'men' | 'women'

export type MatchType = 'men' | 'women' | 'tag'

export interface Wrestler {
  id: string
  name: string
  division: Division
}

/** A champion: one wrestler for singles titles, two for the tag titles. */
export interface ChampionRef {
  rosterId: string
  entrantIds: string[]
}

export interface Champions {
  men: ChampionRef | null
  women: ChampionRef | null
  tag: ChampionRef | null
}

/** One side of a match: one wrestler in singles, two in a tag match. */
export interface Side {
  rosterId: string
  entrantIds: string[]
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
  champions: Champions
}

export interface LeagueState {
  rosters: Roster[]
  shows: Show[]
}
