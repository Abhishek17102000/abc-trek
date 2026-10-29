import type { State } from '../store'
import { PLACES } from '../data/trek'
import type { Analysis } from './plan'
import { fmt } from './dates'

/** A plain-text summary to send to family: itinerary, emergency contacts and the last known stop. */
export function buildShareText(s: State, plan: Analysis): string {
  const e = s.emergency
  const lines: string[] = []
  lines.push(`🏔️ Annapurna Base Camp trek${s.name ? ` · ${s.name}` : ''}`)
  lines.push('')
  lines.push('Plan (may shift with weather/health):')
  for (const d of plan.days) {
    const n = d.night && PLACES[d.night] ? ` → sleep ${PLACES[d.night].name} (${PLACES[d.night].alt.toLocaleString()} m)` : ''
    lines.push(`• ${fmt(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.title.replace(/^Day \d+: /, '')}${n}`)
  }
  if (s.trip.returnTime) lines.push(`Flight home ${fmt(s.trip.returnDate)} at ${s.trip.returnTime}`)

  const evenings = Object.entries(s.checkins)
    .filter(([, c]) => c.evening)
    .sort(([a], [b]) => (a < b ? 1 : -1))
  if (evenings[0]) {
    const [date, c] = evenings[0]
    lines.push('')
    lines.push(`Last check-in: ${fmt(date)}: at ${PLACES[c.evening!.place]?.name ?? c.evening!.place}${c.evening!.note ? `. ${c.evening!.note}` : ''}`)
  }
  lines.push('')
  lines.push('Emergency info:')
  if (e.bloodGroup) lines.push(`Blood group: ${e.bloodGroup}`)
  if (e.allergies) lines.push(`Allergies: ${e.allergies}`)
  if (e.medicines) lines.push(`Medicines: ${e.medicines}`)
  if (e.insurer || e.policy) lines.push(`Insurance: ${[e.insurer, e.policy].filter(Boolean).join(' · ')}`)
  if (e.helpline) lines.push(`Insurer 24h helpline: ${e.helpline}`)
  if (e.hotelPokhara) lines.push(`Pokhara hotel: ${e.hotelPokhara}`)
  lines.push('Nepal: Police 100 · Ambulance 102 · Tourist Police 1144')
  lines.push('There is no mobile signal on parts of the trail: silence for a day is normal. Raise the alarm if I am more than 2 days late.')
  return lines.join('\n')
}
