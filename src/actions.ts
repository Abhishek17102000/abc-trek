import { VARIANTS } from './data/trek'
import { getState, setState, uid, type EveningLog, type MorningLog } from './store'
import { withRestHere, type Analysis } from './engine/plan'
import type { Expense } from './engine/budget'

export function saveMorning(date: string, log: MorningLog) {
  setState((s) => ({ checkins: { ...s.checkins, [date]: { ...s.checkins[date], morning: log } } }))
}

/**
 * Evening check-in. If the place you slept at is the end of one of the stages, everything up to and including that
 * stage is marked reached; later stages are un-marked so the plan re-flows from where you really are.
 */
export function saveEvening(date: string, log: EveningLog) {
  setState((s) => {
    const stages = VARIANTS[s.trip.variant].stages
    const idx = stages.findIndex((st) => st.to === log.place)
    const progress = { ...s.progress }
    if (idx >= 0) {
      stages.forEach((st, i) => {
        if (i < idx) progress[st.id] = progress[st.id] ?? date
        if (i === idx) progress[st.id] = date
        if (i > idx) delete progress[st.id]
      })
    }
    return { progress, checkins: { ...s.checkins, [date]: { ...s.checkins[date], evening: log } } }
  })
}

/**
 * Stay an extra day where you slept last night. Inserted after the previous stage; on the first trek day it delays
 * the start by one day instead.
 */
export function addRestHere(plan: Analysis, today: string): string {
  const next = withRestHere(getState().trip, plan, today)
  if (!next) return 'Rest days can only be added during the trek.'
  setState(() => ({ trip: next }))
  return 'Rest day added. The rest of the plan has shifted by one day.'
}

export function addExpense(e: Omit<Expense, 'id'>) {
  setState((s) => ({ expenses: [...s.expenses, { ...e, id: uid() }] }))
}

export function deleteExpense(id: string) {
  setState((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }))
}

export function toggleDone(id: string) {
  setState((s) => ({ done: { ...s.done, [id]: !s.done[id] } }))
}

export function setTrip(patch: Partial<ReturnType<typeof getState>['trip']>) {
  setState((s) => ({ trip: { ...s.trip, ...patch } }))
}
