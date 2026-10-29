import { useEffect, useMemo, useState } from 'react'
import { useStore, setState, getState } from './store'
import { buildPlan, dayFor, type Analysis } from './engine/plan'
import { todayLocal } from './engine/dates'
import { fetchForecast } from './engine/weather'
import { PLACES, VARIANTS } from './data/trek'

/** Re-renders every 30 s and when the app returns to the foreground. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 30000)
    const vis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('focus', tick)
    }
  }, [])
  return now
}

/** Today's date, or the simulated date if the user is exploring the trip. */
export function useToday(): string {
  const sim = useStore((s) => s.simDate)
  const now = useNow()
  return sim ?? todayLocal(now)
}

export function usePlan(): Analysis {
  const trip = useStore((s) => s.trip)
  const progress = useStore((s) => s.progress)
  const today = useToday()
  return useMemo(() => buildPlan(trip, progress, today), [trip, progress, today])
}

export function useTodayPlan() {
  const plan = usePlan()
  const today = useToday()
  const day = dayFor(plan, today)
  // the stage you are walking today, or the last one you finished
  const stageDay = day?.kind === 'trek' ? day : undefined
  return { plan, today, day, stageDay }
}

const STALE_MS = 3 * 3600 * 1000

/** Keeps a cached forecast for every overnight stop, refreshing when online. */
export function useForecastLoader(): void {
  const variant = useStore((s) => s.trip.variant)
  useEffect(() => {
    if (!navigator.onLine) return
    const ctl = new AbortController()
    const ids = [...new Set(VARIANTS[variant].stages.map((s) => s.to).filter((id) => id !== 'pkr')), 'pkr']
    for (const id of ids) {
      const c = getState().forecast[id]
      if (c && Date.now() - c.fetched < STALE_MS) continue
      if (!PLACES[id]) continue
      fetchForecast(id, ctl.signal)
        .then((daily) => setState((s) => ({ forecast: { ...s.forecast, [id]: { fetched: Date.now(), daily } } })))
        .catch(() => undefined)
    }
    return () => ctl.abort()
  }, [variant])
}
