import type { Champions, LeagueState, Match, MatchType, Show, Side } from './types'

const FINISHES = [
  'wins by pinfall',
  'wins by submission',
  'wins by count-out',
  'wins after a distraction',
  'wins by disqualification',
  'wins with a roll-up',
]

export function sideLabel(state: LeagueState, side: Side): string {
  const roster = state.rosters.find((r) => r.id === side.rosterId)
  const names = side.entrantIds
    .map((id) => roster?.wrestlers.find((w) => w.id === id)?.name ?? 'Unknown')
    .filter((name) => name !== 'Unknown')
  return names.length > 0 ? names.join(' & ') : 'Unknown'
}

export function sameSide(a: Side | null, b: Side): boolean {
  if (!a || a.rosterId !== b.rosterId || a.entrantIds.length !== b.entrantIds.length) return false
  const sorted = [...b.entrantIds].sort()
  return [...a.entrantIds].sort().every((id, i) => id === sorted[i])
}

function championKey(type: MatchType): keyof Champions {
  return type === 'men' ? 'men' : type === 'women' ? 'women' : 'tag'
}

function titleLabel(type: MatchType): string {
  return type === 'men' ? "Men's Championship" : type === 'women' ? "Women's Championship" : 'Tag Team Championship'
}

export interface SimulationResult {
  show: Show
  rosters: LeagueState['rosters']
}

/** Picks winners for every match in the show and applies any title changes. */
export function simulateShow(state: LeagueState, show: Show): SimulationResult {
  const rosters = state.rosters.map((r) => ({ ...r, champions: { ...r.champions } }))
  const working: LeagueState = { ...state, rosters }

  const matches: Match[] = show.matches.map((match) => {
    const required = match.type === 'tag' ? 2 : 1
    const validIndices = match.sides
      .map((s, i) => (s.entrantIds.filter(Boolean).length >= required ? i : -1))
      .filter((i) => i >= 0)
    if (validIndices.length < 2) {
      return {
        ...match,
        winnerIndex: null,
        summary: match.type === 'tag' ? 'Needs at least two teams of two' : 'Needs at least two competitors',
      }
    }

    const winnerIndex = validIndices[Math.floor(Math.random() * validIndices.length)]
    const winner = match.sides[winnerIndex]
    const finish = FINISHES[Math.floor(Math.random() * FINISHES.length)]
    const losers = validIndices.filter((i) => i !== winnerIndex).map((i) => sideLabel(working, match.sides[i]))
    let summary = `${sideLabel(working, winner)} ${finish} over ${losers.join(', ')}`

    if (match.titleRosterId) {
      const titleRoster = rosters.find((r) => r.id === match.titleRosterId)
      if (titleRoster) {
        const key = championKey(match.type)
        const current = titleRoster.champions[key]
        if (sameSide(current, winner)) {
          summary += ` and retains the ${titleRoster.name} ${titleLabel(match.type)}`
        } else {
          titleRoster.champions[key] = { rosterId: winner.rosterId, entrantIds: [...winner.entrantIds] }
          summary += ` and wins the ${titleRoster.name} ${titleLabel(match.type)}`
        }
      }
    }

    return { ...match, winnerIndex, summary }
  })

  return {
    show: { ...show, matches, simulatedAt: new Date().toISOString() },
    rosters,
  }
}
