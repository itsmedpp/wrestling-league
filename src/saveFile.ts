import type { Champions, ChampionRef, LeagueState, Match, MatchType, Roster, Show, Side, Wrestler } from './types'

const MATCH_TYPES: MatchType[] = ['men', 'women', 'tag']

/** Save files written before tag teams were replaced by pairs of wrestlers. */
type LegacyTeams = Map<string, string[]>

export function downloadSaveFile(state: LeagueState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wrestling-league-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

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
  }
}

function show(value: unknown, teams: LegacyTeams): Show {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    rosterId: str(value.rosterId),
    name: str(value.name),
    matches: arr(value.matches).map((m) => match(m, teams)),
    simulatedAt: typeof value.simulatedAt === 'string' ? value.simulatedAt : null,
  }
}

export function parseSaveFile(text: string): LeagueState {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) invalid()
  const rosters = arr(parsed.rosters)
  const teams: LegacyTeams = new Map()
  for (const entry of rosters) {
    for (const [id, memberIds] of legacyTeams(entry)) teams.set(id, memberIds)
  }
  return {
    rosters: rosters.map((r) => roster(r, teams)),
    shows: arr(parsed.shows).map((s) => show(s, teams)),
    stipulations:
      parsed.stipulations === undefined ? [] : arr(parsed.stipulations).map(str).filter(Boolean),
  }
}
