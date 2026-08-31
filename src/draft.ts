import { newId } from './id'
import type { Division, Draft, DraftLimits, League, PoolWrestler, Roster } from './types'

/** Wrestlers drafted per roster unless the league picks another number. */
export const DEFAULT_DRAFT_ROUNDS = 20

export function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function totalPicks(draft: Draft): number {
  return draft.order.length * draft.rounds
}

export function isDraftComplete(draft: Draft): boolean {
  return draft.picks.length >= totalPicks(draft)
}

/** Snake order: the randomized order in odd rounds, reversed in even ones. */
export function pickingRosterId(draft: Draft): string | null {
  const teams = draft.order.length
  if (teams === 0 || isDraftComplete(draft)) return null
  const round = Math.floor(draft.picks.length / teams)
  const slot = draft.picks.length % teams
  return draft.order[round % 2 === 0 ? slot : teams - 1 - slot]
}

/** 1-based round currently on the clock, or the last round once the draft is done. */
export function currentRound(draft: Draft): number {
  const teams = draft.order.length
  if (teams === 0) return 0
  return Math.min(draft.rounds, Math.floor(draft.picks.length / teams) + 1)
}

export function NO_LIMITS(): DraftLimits {
  return { men: null, women: null }
}

export function picksFor(draft: Draft, rosterId: string, division?: Division): number {
  return draft.picks.filter(
    (p) => p.rosterId === rosterId && (division === undefined || p.division === division),
  ).length
}

/** False once the roster has hit its limit for that division. */
export function canDraft(draft: Draft, rosterId: string, division: Division): boolean {
  const limit = draft.limits[division]
  return limit === null || picksFor(draft, rosterId, division) < limit
}

export function newDraft(rosters: Roster[], rounds: number, limits: DraftLimits): Draft {
  return {
    id: newId(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    rounds,
    limits,
    order: shuffle(rosters.map((r) => r.id)),
    picks: [],
  }
}

/** Names already taken in this league, so nobody is drafted twice. */
export function draftedNames(league: League): Set<string> {
  return new Set(league.rosters.flatMap((r) => r.wrestlers.map((w) => w.name.toLowerCase())))
}

export function undraftedPool(league: League, pool: PoolWrestler[]): PoolWrestler[] {
  const taken = draftedNames(league)
  return pool.filter((p) => !taken.has(p.name.toLowerCase()))
}
