export type Division = 'men' | 'women'

/** `tag6` and `tag8` are the six- and eight-man tags; they can never be title matches. */
export type MatchType = 'men' | 'women' | 'tag' | 'tag6' | 'tag8'

export interface Wrestler {
  id: string
  name: string
  division: Division
}

/** A name in the shared pool that league rosters draw from. */
export interface PoolWrestler {
  id: string
  name: string
  /** Real-life promotion such as "WWE" or "AEW". */
  promotion: string
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
  /** Star rating from 1 to 5 in half-star steps, or null before the show is simulated. */
  rating: number | null
}

export interface Show {
  id: string
  rosterId: string
  name: string
  matches: Match[]
  /** The match billed as the main event, or null when the show has none. */
  mainEventId: string | null
  simulatedAt: string | null
}

export interface Roster {
  id: string
  name: string
  owner: string
  /** PNG data URL, or empty when the roster has no logo. */
  logo: string
  wrestlers: Wrestler[]
  champions: Champions
}

export interface LeagueState {
  /** PNG data URL for the whole league, or empty when there is none. */
  leagueLogo: string
  rosters: Roster[]
  shows: Show[]
  /** Every stipulation a match can be given; seeded with the built-in ones and fully editable. */
  stipulationList: string[]
  /** Names available to every league roster; seeded from the real WWE/NXT/AEW/TNA rosters. */
  pool: PoolWrestler[]
}
