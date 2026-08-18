export type Division = 'men' | 'women'

/** `tag6` and `tag8` are the six- and eight-man tags; they can never be title matches. */
export type MatchType = 'men' | 'women' | 'tag' | 'tag6' | 'tag8'

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

/** One side of a match: one wrestler in singles, two to four in the tag matches. */
export interface Side {
  rosterId: string
  entrantIds: string[]
}

export interface Match {
  id: string
  type: MatchType
  /** Stipulation such as "Ladder Match"; empty means a standard match. */
  stipulation: string
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
  owner: string
  wrestlers: Wrestler[]
  champions: Champions
}

export interface LeagueState {
  rosters: Roster[]
  shows: Show[]
  /** Custom stipulations, offered alongside the built-in ones. */
  stipulations: string[]
}
