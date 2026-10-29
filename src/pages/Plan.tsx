import { useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Banner, Btn, Card, Chip, Icon, Screen, SectionTitle, Segmented } from '../ui'
import { useAll } from '../store'
import { useForecastLoader, usePlan, useToday } from '../hooks'
import { bufferMessage, whatIf, type PlanDay } from '../engine/plan'
import { fmt } from '../engine/dates'
import { PLACES, VARIANTS, type VariantId } from '../data/trek'
import { describe, wxAdvice } from '../engine/weather'
import { setTrip } from '../actions'

const KIND_ICON: Record<PlanDay['kind'], 'bed' | 'mountain' | 'map' | 'clock' | 'sun'> = { arrive: 'map', travel: 'map', prep: 'bed', trek: 'mountain', rest: 'bed', buffer: 'sun', return: 'clock' }

export default function Plan() {
  const s = useAll()
  const plan = usePlan()
  const today = useToday()
  const [open, setOpen] = useState<string | null>(null)
  useForecastLoader()
  const msg = bufferMessage(plan)
  const stages = VARIANTS[s.trip.variant].stages

  const variantStatus = (v: VariantId) => whatIf(s.trip, s.progress, { variant: v })

  return (
    <Screen title="Plan" subtitle={`${fmt(plan.days[0].date, { day: 'numeric', month: 'short' })} → ${fmt(s.trip.returnDate, { day: 'numeric', month: 'short' })} · ${plan.trekDays} trek days`} right={<Link to="/settings" className="rounded-xl bg-surface2 px-3 py-2 text-sm font-semibold">Edit dates</Link>}>
      <Banner tone={msg.tone === 'good' ? 'good' : msg.tone === 'warn' ? 'warn' : 'bad'} icon={msg.tone === 'good' ? 'check' : 'clock'} title={plan.status === 'comfortable' ? 'Flight buffer looks good' : plan.status === 'tight' ? 'Flight buffer: none' : 'Plan does not fit your flight'}>
        {msg.text}
      </Banner>

      <SectionTitle>Route</SectionTitle>
      <Card className="space-y-3">
        <Segmented label="Route variant" value={s.trip.variant} onChange={(v) => setTrip({ variant: v })} options={(Object.keys(VARIANTS) as VariantId[]).map((v) => ({ value: v, label: v === 'direct' ? '6 days · direct' : '7 days · safer' }))} />
        <p className="text-sm text-muted">{VARIANTS[s.trip.variant].blurb}</p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          {(Object.keys(VARIANTS) as VariantId[]).map((v) => {
            const a = variantStatus(v)
            return (
              <div key={v} className="rounded-xl bg-surface2 p-2">
                <p className="font-semibold">{v === 'direct' ? 'Direct' : 'Safer'}</p>
                <p className="text-muted">Back in Pokhara {fmt(a.lastTrekDate, { day: 'numeric', month: 'short' })}</p>
                <Chip tone={a.status === 'comfortable' ? 'good' : a.status === 'tight' ? 'warn' : 'bad'}>{a.status === 'comfortable' ? `${a.bufferDays} spare` : a.status === 'tight' ? 'no buffer' : 'too late'}</Chip>
              </div>
            )
          })}
        </div>
        {plan.sleepWarnings.length > 0 && (
          <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
            ⚠ Sleeping altitude jumps: {plan.sleepWarnings.map((w) => `${w.to} +${w.gain} m`).join(', ')}. Guideline: ≤ 500 m per night above 3,000 m. {s.trip.variant === 'direct' ? 'The safer route splits the ABC day by sleeping at MBC.' : 'Climb slowly and consider a rest day at Deurali.'}
          </p>
        )}
      </Card>

      <SectionTitle>Acclimatisation days</SectionTitle>
      <Card className="divide-y divide-line !p-0">
        {stages.slice(0, -1).filter((st) => (PLACES[st.to]?.alt ?? 0) >= 2000).map((st) => {
          const n = s.trip.restDays[st.id] ?? 0
          return (
            <div key={st.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Rest after {PLACES[st.to].name}</p>
                <p className="text-xs text-muted">{PLACES[st.to].alt.toLocaleString()} m</p>
              </div>
              <div className="flex items-center rounded-xl bg-surface2">
                <button type="button" aria-label={`Fewer rest days at ${PLACES[st.to].name}`} disabled={n === 0} onClick={() => setTrip({ restDays: { ...s.trip.restDays, [st.id]: n - 1 } })} className="grid h-10 w-10 place-items-center text-muted">
                  <Icon name="minus" size={16} />
                </button>
                <span className="w-6 text-center font-semibold tabular-nums">{n}</span>
                <button type="button" aria-label={`More rest days at ${PLACES[st.to].name}`} disabled={n >= 3} onClick={() => setTrip({ restDays: { ...s.trip.restDays, [st.id]: n + 1 } })} className="grid h-10 w-10 place-items-center text-muted">
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </Card>

      <SectionTitle>Day by day</SectionTitle>
      <div className="space-y-2">
        {plan.days.map((d) => {
          const isOpen = open === d.date
          const isToday = d.date === today
          const nightId = d.night
          const wx = nightId ? s.forecast[nightId]?.daily.find((w) => w.date === d.date) : undefined
          return (
            <div key={d.date} className={clsx('rounded-2xl border bg-surface', isToday ? 'border-accent' : 'border-line', d.done && 'opacity-60')}>
              <button type="button" onClick={() => setOpen(isOpen ? null : d.date)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3 text-left">
                <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', d.kind === 'trek' ? 'bg-accent-soft text-accent' : 'bg-surface2 text-muted')}>
                  <Icon name={KIND_ICON[d.kind]} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                    {fmt(d.date)} {isToday && '· today'}
                  </span>
                  <span className="block truncate font-semibold">{d.title}</span>
                </span>
                {wx && <span title={describe(wx.code).text} className="text-lg">{describe(wx.code).icon}</span>}
                <Icon name={isOpen ? 'up' : 'down'} size={18} className="text-muted" />
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-line px-3 pb-3 pt-2 text-sm">
                  <p className="text-muted">{d.note}</p>
                  {d.night && PLACES[d.night] && (
                    <p>
                      <b>Sleep:</b> {PLACES[d.night].name} ({PLACES[d.night].alt.toLocaleString()} m)
                      <br />
                      <span className="text-muted">Wi-Fi {PLACES[d.night].services.wifi} · charging {PLACES[d.night].services.charging} · shower {PLACES[d.night].services.shower}</span>
                    </p>
                  )}
                  {d.stage && (
                    <>
                      <p>
                        <b>{d.stage.km} km · {d.stage.hours}</b>
                      </p>
                      <ol className="list-decimal space-y-1 pl-5">
                        {d.stage.steps.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ol>
                      <ul className="list-disc space-y-1 pl-5 text-muted">
                        {d.stage.tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      {d.stage.alerts.map((t) => (
                        <p key={t} className="font-medium text-warn">⚠ {t}</p>
                      ))}
                    </>
                  )}
                  {wx && (
                    <p className="rounded-xl bg-surface2 p-2">
                      {describe(wx.code).icon} {describe(wx.code).text}: {wx.min}° / {wx.max}°C, wind {wx.windKmh} km/h
                      {wx.snowCm ? `, snow ${wx.snowCm} cm` : wx.rainMm ? `, rain ${wx.rainMm} mm` : ''}
                      {nightId && wxAdvice(wx, PLACES[nightId].alt) && <span className="mt-1 block font-medium text-warn">{wxAdvice(wx, PLACES[nightId].alt)}</span>}
                    </p>
                  )}
                  {!wx && nightId && <p className="text-xs text-muted">Forecast loads when you have internet (up to 16 days ahead) and is then kept offline.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Btn variant="soft" block onClick={() => setOpen(null)}>Collapse all</Btn>
    </Screen>
  )
}
