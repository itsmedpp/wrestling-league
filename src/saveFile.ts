import type { Champions, ChampionRef, LeagueState, Match, MatchType, Roster, Show, Side, TagTeam, Wrestler } from './types'

const MATCH_TYPES: MatchType[] = ['men', 'women', 'tag']

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

function championRef(value: unknown): ChampionRef | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) invalid()
  return { rosterId: str(value.rosterId), entrantId: str(value.entrantId) }
}

function champions(value: unknown): Champions {
  if (!isRecord(value)) return { men: null, women: null, tag: null }
  return {
    men: championRef(value.men),
    women: championRef(value.women),
    tag: championRef(value.tag),
  }
}

function wrestler(value: unknown): Wrestler {
  if (!isRecord(value)) invalid()
  const division = value.division === 'women' ? 'women' : 'men'
  return { id: str(value.id), name: str(value.name), division }
}

function tagTeam(value: unknown): TagTeam {
  if (!isRecord(value)) invalid()
  return { id: str(value.id), name: str(value.name), memberIds: arr(value.memberIds).map(str) }
}

function roster(value: unknown): Roster {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    name: str(value.name),
    wrestlers: arr(value.wrestlers).map(wrestler),
    tagTeams: arr(value.tagTeams).map(tagTeam),
    champions: champions(value.champions),
  }
}

function side(value: unknown): Side {
  if (!isRecord(value)) invalid()
  return { rosterId: str(value.rosterId), entrantId: str(value.entrantId) }
}

function match(value: unknown): Match {
  if (!isRecord(value)) invalid()
  const type = MATCH_TYPES.find((t) => t === value.type)
  if (!type) invalid()
  return {
    id: str(value.id),
    type,
    titleRosterId: value.titleRosterId == null ? null : str(value.titleRosterId),
    sides: arr(value.sides).map(side),
    winnerIndex: typeof value.winnerIndex === 'number' ? value.winnerIndex : null,
    summary: typeof value.summary === 'string' ? value.summary : null,
  }
}

function show(value: unknown): Show {
  if (!isRecord(value)) invalid()
  return {
    id: str(value.id),
    rosterId: str(value.rosterId),
    name: str(value.name),
    matches: arr(value.matches).map(match),
    simulatedAt: typeof value.simulatedAt === 'string' ? value.simulatedAt : null,
  }
}

export function parseSaveFile(text: string): LeagueState {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) invalid()
  return {
    rosters: arr(parsed.rosters).map(roster),
    shows: arr(parsed.shows).map(show),
  }
}
