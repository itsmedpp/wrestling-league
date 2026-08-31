import { seedPool } from './pool'
import { BUILT_IN_STIPULATIONS } from './stipulations'
import { newId } from './id'
import type {
  Champions,
  ChampionRef,
  Draft,
  DraftPick,
  League,
  LeagueState,
  Match,
  MatchType,
  PoolWrestler,
  Roster,
  Show,
  Side,
  Wrestler,
} from './types'

const MATCH_TYPES: MatchType[] = ['men', 'women', 'tag', 'tag6', 'tag8']

/** Save files written before tag teams were replaced by pairs of wrestlers. */
type LegacyTeams = Map<string, string[]>

class SaveFileError extends Error {}

function invalid(): never {
  throw new SaveFileError('That file is not a wrestling league save file.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string {
  if (typeof value !== 'string') invalid()
  return value
}

function arr(value: unknown): unknown[] {
  if (!Array.isArray(value)) invalid()
  return value
}

function entrantIds(value: Record<string, unknown>, teams: LegacyTeams): string[] {
  if (value.entrantIds !== undefined) return arr(value.entrantIds).map(str).filter(Boolean)
  const legacy = str(value.entrantId)
  if (!legacy) return []
  return teams.get(legacy) ?? [legacy]
}

function championRef(value: unknown, teams: LegacyTeams): ChampionRef | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) invalid()
  const ids = entrantIds(value, teams)
  return ids.length > 0 ? { rosterId: str(value.rosterId), entrantIds: ids } : null
}

function champions(value: unknown, teams: LegacyTeams): Champions {
  if (!isRecord(value)) return { men: null, women: null, tag: null }
  return {
    men: championRef(value.men, teams),
    women: championRef(value.women, teams),
    tag: championRef(value.tag, teams),
  }
}

function wrestler(value: unknown): Wrestler {
  if (!isRecord(value)) invalid()
  const division = value.division === 'women' ? 'women' : 'men'
  return { id: str(value.id), name: str(value.name), division }
}

function poolWrestler(value: unknown): PoolWrestler {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    name: str(value.name),
    promotion: typeof value.promotion === 'string' ? value.promotion : '',
    division: value.division === 'women' ? 'women' : 'men',
  }
}

function legacyTeams(value: unknown): LegacyTeams {
  const teams: LegacyTeams = new Map()
  if (!isRecord(value) || value.tagTeams === undefined) return teams
  for (const team of arr(value.tagTeams)) {
    if (!isRecord(team)) invalid()
    teams.set(str(team.id), arr(team.memberIds).map(str))
  }
  return teams
}

function roster(value: unknown, teams: LegacyTeams): Roster {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    name: str(value.name),
    owner: typeof value.owner === 'string' ? value.owner : '',
    logo: typeof value.logo === 'string' ? value.logo : '',
    wrestlers: arr(value.wrestlers).map(wrestler),
    champions: champions(value.champions, teams),
  }
}

function side(value: unknown, teams: LegacyTeams): Side {
  if (!isRecord(value)) invalid()
  return { rosterId: str(value.rosterId), entrantIds: entrantIds(value, teams) }
}

function match(value: unknown, teams: LegacyTeams): Match {
  if (!isRecord(value)) invalid()
  const type = MATCH_TYPES.find((t) => t === value.type)
  if (!type) invalid()
  return {
    id: str(value.id),
    type,
    stipulation: typeof value.stipulation === 'string' ? value.stipulation : '',
    titleRosterId: value.titleRosterId == null ? null : str(value.titleRosterId),
    sides: arr(value.sides).map((s) => side(s, teams)),
    winnerIndex: typeof value.winnerIndex === 'number' ? value.winnerIndex : null,
    summary: typeof value.summary === 'string' ? value.summary : null,
    rating: typeof value.rating === 'number' ? value.rating : null,
  }
}

function show(value: unknown, teams: LegacyTeams): Show {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    rosterId: str(value.rosterId),
    name: str(value.name),
    matches: arr(value.matches).map((m) => match(m, teams)),
    mainEventId: typeof value.mainEventId === 'string' ? value.mainEventId : null,
    simulatedAt: typeof value.simulatedAt === 'string' ? value.simulatedAt : null,
  }
}

/** Saves written before the list became editable only stored the custom additions. */
function stipulationList(parsed: Record<string, unknown>): string[] {
  if (parsed.stipulationList !== undefined) {
    return arr(parsed.stipulationList).map(str).filter(Boolean)
  }
  const custom = parsed.stipulations === undefined ? [] : arr(parsed.stipulations).map(str).filter(Boolean)
  return [...new Set([...BUILT_IN_STIPULATIONS, ...custom])]
}

function draftPick(value: unknown): DraftPick {
  if (!isRecord(value)) invalid()
  return {
    round: typeof value.round === 'number' ? value.round : 1,
    rosterId: str(value.rosterId),
    name: str(value.name),
    division: value.division === 'women' ? 'women' : 'men',
  }
}

function draftLimit(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function draft(value: unknown): Draft {
  if (!isRecord(value)) invalid()
  const limits = isRecord(value.limits) ? value.limits : {}
  return {
    id: str(value.id),
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : '',
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    rounds: typeof value.rounds === 'number' ? value.rounds : 0,
    limits: { men: draftLimit(limits.men), women: draftLimit(limits.women) },
    order: arr(value.order).map(str),
    picks: arr(value.picks).map(draftPick),
  }
}

function legacyTeamsIn(rosters: unknown[]): LegacyTeams {
  const teams: LegacyTeams = new Map()
  for (const entry of rosters) {
    for (const [id, memberIds] of legacyTeams(entry)) teams.set(id, memberIds)
  }
  return teams
}

function league(value: unknown): League {
  if (!isRecord(value)) invalid()
  const rosters = arr(value.rosters)
  const teams = legacyTeamsIn(rosters)
  return {
    id: str(value.id),
    name: str(value.name),
    logo: typeof value.logo === 'string' ? value.logo : '',
    rosters: rosters.map((r) => roster(r, teams)),
    shows: arr(value.shows).map((s) => show(s, teams)),
    draft: value.draft == null ? null : draft(value.draft),
    draftHistory: value.draftHistory === undefined ? [] : arr(value.draftHistory).map(draft),
  }
}

/** Saves written before leagues existed held a single league's rosters and shows at the top level. */
function leagues(parsed: Record<string, unknown>): League[] {
  if (parsed.leagues !== undefined) return arr(parsed.leagues).map(league)
  const rosters = arr(parsed.rosters)
  const teams = legacyTeamsIn(rosters)
  return [
    {
      id: newId(),
      name: 'Chairshot Wrestling League',
      logo: typeof parsed.leagueLogo === 'string' ? parsed.leagueLogo : '',
      rosters: rosters.map((r) => roster(r, teams)),
      shows: arr(parsed.shows).map((s) => show(s, teams)),
      draft: null,
      draftHistory: [],
    },
  ]
}

export function parseSaveFile(text: string): LeagueState {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) invalid()
  return {
    leagues: leagues(parsed),
    stipulationList: stipulationList(parsed),
    pool: parsed.pool === undefined ? seedPool() : arr(parsed.pool).map(poolWrestler),
  }
}
