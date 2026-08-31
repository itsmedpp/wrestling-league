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

export interface DraftPick {
  /** 1-based round the pick was made in. */
  round: number
  rosterId: string
  name: string
  division: Division
}

/** Most wrestlers of each division a roster may draft; null means no limit. */
export interface DraftLimits {
  men: number | null
  women: number | null
}

/** A snake draft that stocks a league's rosters from the shared pool. */
export interface Draft {
  id: string
  startedAt: string
  completedAt: string | null
  /** Wrestlers drafted per roster. */
  rounds: number
  limits: DraftLimits
  /** Randomized roster order for the odd rounds; even rounds run it backwards. */
  order: string[]
  picks: DraftPick[]
}

/** One promotion: its own rosters, shows, champions, and logo. Leagues never mix. */
export interface League {
  id: string
  name: string
  /** PNG data URL for the league, or empty when there is none. */
  logo: string
  rosters: Roster[]
  shows: Show[]
  /** The draft in progress, or the last completed one; null before the league has ever drafted. */
  draft: Draft | null
  /** Every earlier draft, oldest first, kept when the league redrafts. */
  draftHistory: Draft[]
}

export interface LeagueState {
  leagues: League[]
  /** Every stipulation a match can be given; seeded with the built-in ones and fully editable. */
  stipulationList: string[]
  /** Names every league roster can draw from; seeded from the real WWE/NXT/AEW/TNA rosters. */
  pool: PoolWrestler[]
}
