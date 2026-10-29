import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Banner, Btn, Card, Chip, Icon, Screen, SectionTitle } from '../ui'
import { useAll } from '../store'
import { useNow, useTodayPlan } from '../hooks'
import { buildPlan, bufferMessage, withRestHere, type Analysis, type Progress, type Trip } from '../engine/plan'
import { addDays, diffDays, fmt } from '../engine/dates'
import { FACTS, PLACES, VARIANTS } from '../data/trek'
import { ITEMS } from '../data/lists'
import { assess, LEVEL_TONE } from '../engine/ams'
import { describe, wxAdvice } from '../engine/weather'
import { addRestHere, toggleDone } from '../actions'
import { CheckInSheet } from './CheckIn'
import { toast } from '../ui'

function restText(trip: Trip, progress: Progress, plan: Analysis, today: string): string {
  const next = withRestHere(trip, plan, today)
  if (!next) return ''
  return 'With a rest day: ' + bufferMessage(buildPlan(next, progress, today)).text
}

export const sleptAt = (plan: Analysis, today: string): string => {
  const prev = [...plan.days].reverse().find((d) => d.date < today && d.night)
  return prev?.night ?? 'pkr'
}

export default function Today() {
  const s = useAll()
  const now = useNow()
  const { plan, today, day } = useTodayPlan()
  const [sheet, setSheet] = useState<'morning' | 'evening' | null>(null)
  const first = plan.days[0]?.date
  const phase = !first || today < first ? 'before' : today > plan.days[plan.days.length - 1].date ? 'after' : 'during'
  const hour = now.getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <Screen title={`${greet}${s.name ? `, ${s.name}` : ''}`} subtitle={fmt(today, { weekday: 'long', day: 'numeric', month: 'long' })}>
      {s.simDate && (
        <Banner tone="accent" icon="clock" title={`Previewing ${fmt(s.simDate)}`} action={<Link to="/settings" className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-fg">Back to real date</Link>}>
          You are exploring the trip. Nothing here is real until you switch back.
        </Banner>
      )}
      {phase === 'before' && <Before plan={plan} today={today} />}
      {phase === 'during' && day && <During plan={plan} today={today} hour={hour} onSheet={setSheet} />}
      {phase === 'after' && <After />}
      {sheet && <CheckInSheet mode={sheet} date={today} plan={plan} slept={sleptAt(plan, today)} onClose={() => setSheet(null)} />}
    </Screen>
  )
}

function Before({ plan, today }: { plan: Analysis; today: string }) {
  const s = useAll()
  const arrive = plan.days[0].date
  const left = diffDays(today, arrive)
  const msg = bufferMessage(plan)
  const tasks = ITEMS.filter((i) => i.due !== undefined)
    .map((i) => ({ item: i, dueDate: addDays(arrive, -(i.due as number)) }))
    .filter((t) => !s.done[t.item.id])
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const next = tasks.slice(0, 6)
  const essentials = ITEMS.filter((i) => i.essential)
  const ready = essentials.filter((i) => s.done[i.id]).length
  const unverified = FACTS.filter((f) => f.confidence !== 'confirmed' && !s.verified[f.id]).length

  return (
    <>
      <Card className="bg-gradient-to-br from-teal/25 to-accent/20">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">Annapurna Base Camp</p>
        <p className="mt-1 text-5xl font-bold tabular-nums">
          {left}
          <span className="ml-2 text-xl font-semibold text-muted">{left === 1 ? 'day to go' : 'days to go'}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Fly {fmt(arrive)} → Kathmandu · Trek {fmt(s.trip.trekStart, { day: 'numeric', month: 'short' })} to {fmt(plan.lastTrekDate, { day: 'numeric', month: 'short' })} · Home {fmt(s.trip.returnDate, { day: 'numeric', month: 'short' })}
        </p>
      </Card>

      {plan.status !== 'comfortable' && (
        <Banner tone={msg.tone === 'bad' ? 'bad' : 'warn'} title={plan.status === 'tight' ? 'No spare day before your flight' : 'Your plan does not fit your flight'} action={<Link to="/plan" className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-bg">See options</Link>}>
          {msg.text}
        </Banner>
      )}
      {plan.sleepWarnings.length > 0 && (
        <Banner tone="warn" icon="mountain" title="Big jump in sleeping altitude" action={<Link to="/plan" className="rounded-xl bg-surface2 px-3 py-2 text-sm font-semibold text-ink">Safer route</Link>}>
          {plan.sleepWarnings.map((w) => `${w.to} is +${w.gain} m`).join(' · ')}. The usual guideline is ≤ 500 m per night above 3,000 m.
        </Banner>
      )}

      <SectionTitle right={<Chip tone={ready === essentials.length ? 'good' : 'warn'}>{ready}/{essentials.length} essentials</Chip>}>Do this next</SectionTitle>
      <Card className="divide-y divide-line !p-0">
        {next.length === 0 && <p className="p-4 text-sm text-muted">All preparation tasks are done. Enjoy the trip!</p>}
        {next.map(({ item, dueDate }) => {
          const late = dueDate < today
          return (
            <button key={item.id} type="button" onClick={() => toggleDone(item.id)} aria-pressed={false} className="flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-line" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.text}</span>
                <span className={late ? 'text-xs font-semibold text-bad' : 'text-xs text-muted'}>{late ? `Overdue (was due ${fmt(dueDate, { day: 'numeric', month: 'short' })})` : dueDate === today ? 'Due today' : `Due ${fmt(dueDate, { weekday: 'short', day: 'numeric', month: 'short' })}`}</span>
              </span>
            </button>
          )
        })}
      </Card>
      <Link to="/pack" className="block text-center text-sm font-semibold text-accent">All tasks &amp; packing list →</Link>

      {unverified > 0 && (
        <Card onClick={undefined} tone="warn">
          <Link to="/facts" className="flex items-center gap-3">
            <Icon name="info" className="text-warn" />
            <span className="flex-1">
              <span className="block font-semibold">{unverified} things to verify before you go</span>
              <span className="text-sm text-muted">Permits, guide rule, cash and transport (sources disagree).</span>
            </span>
            <Icon name="right" className="text-muted" />
          </Link>
        </Card>
      )}
    </>
  )
}

function During({ plan, today, hour, onSheet }: { plan: Analysis; today: string; hour: number; onSheet: (m: 'morning' | 'evening') => void }) {
  const s = useAll()
  const day = plan.days.find((d) => d.date === today)!
  const ci = s.checkins[today]
  const nightId = day.night ?? 'pkr'
  const place = PLACES[nightId]
  const wx = s.forecast[nightId]?.daily.find((w) => w.date === today)
  const stage = day.stage
  const last = ci?.morning ? assess(ci.morning.symptoms, ci.morning.flags, ci.morning.spo2, PLACES[sleptAt(plan, today)]?.alt) : null
  const nextDay = plan.days.find((d) => d.date === addDays(today, 1))
  const trekMode = day.kind === 'trek' || day.kind === 'rest'

  return (
    <>
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Chip tone={day.kind === 'trek' ? 'accent' : 'neutral'}>{day.kind === 'trek' ? `Trek day ${(day.stageIdx ?? 0) + 1} of ${VARIANTS[s.trip.variant].stages.length}` : day.kind === 'rest' ? 'Rest day' : day.kind === 'return' ? 'Travel home' : 'Travel & prep'}</Chip>
            <h2 className="mt-2 text-xl font-bold leading-tight">{day.title.replace(/^Day \d+: /, '')}</h2>
          </div>
          {place && (
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold tabular-nums">{place.alt.toLocaleString()}</p>
              <p className="text-xs text-muted">m tonight</p>
            </div>
          )}
        </div>
        <p className="text-sm text-muted">{day.note}</p>
        {stage && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Chip>{stage.km} km</Chip>
            <Chip>{stage.hours}</Chip>
            {place && <Chip>Sleep: {place.name}</Chip>}
          </div>
        )}
        {wx && (
          <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3 text-sm">
            <span className="text-2xl">{describe(wx.code).icon}</span>
            <div className="flex-1">
              <p className="font-semibold">
                {describe(wx.code).text} · {wx.min}° / {wx.max}°C
              </p>
              <p className="text-muted">
                Wind {wx.windKmh} km/h{wx.rainMm ? ` · rain ${wx.rainMm} mm` : ''}{wx.snowCm ? ` · snow ${wx.snowCm} cm` : ''}
              </p>
            </div>
          </div>
        )}
        {wx && place && wxAdvice(wx, place.alt) && <p className="text-sm font-medium text-warn">{wxAdvice(wx, place.alt)}</p>}
        {stage && (
          <details className="group rounded-xl bg-surface2 p-3 text-sm">
            <summary className="cursor-pointer font-semibold">Today's route, tips &amp; alerts</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {stage.steps.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            {stage.tips.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {stage.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {stage.alerts.map((t) => (
              <p key={t} className="mt-2 font-medium text-warn">⚠ {t}</p>
            ))}
          </details>
        )}
      </Card>

      {trekMode && (
        <>
          <SectionTitle>Daily check-ins</SectionTitle>
          <Card className="space-y-3">
            <CheckRow label="Morning health check" sub={ci?.morning ? (last ? last.title : 'Done') : 'Altitude-sickness self-check: decides if it is safe to go higher'} done={!!ci?.morning} urgent={!ci?.morning && hour < 14} onClick={() => onSheet('morning')} tone={last ? LEVEL_TONE[last.level] : undefined} />
            <CheckRow label="Evening check-in" sub={ci?.evening ? `Logged · sleeping at ${PLACES[ci.evening.place]?.name}` : 'Where you slept, water, spend. Updates tomorrow\'s plan'} done={!!ci?.evening} urgent={!ci?.evening && hour >= 16} onClick={() => onSheet('evening')} />
          </Card>
          {last && last.suggestRest && day.kind === 'trek' && (
            <Banner tone="warn" icon="bed" title="Your check-in says: do not go higher today" action={<Btn size="sm" onClick={() => toast(addRestHere(plan, today))}>Take a rest day here</Btn>}>
              {restText(s.trip, s.progress, plan, today)}
            </Banner>
          )}
          {last && last.mustDescend && (
            <Banner tone="bad" title={last.title} action={<Link to="/safety" className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-bg">Emergency help</Link>}>
              {last.actions[0]}
            </Banner>
          )}
        </>
      )}

      {nextDay && (
        <>
          <SectionTitle>Tomorrow</SectionTitle>
          <Card>
            <p className="font-semibold">{nextDay.title.replace(/^Day \d+: /, '')}</p>
            <p className="text-sm text-muted">{nextDay.note}</p>
          </Card>
        </>
      )}

      {plan.status !== 'comfortable' && <Banner tone={plan.status === 'conflict' ? 'bad' : 'warn'} icon="clock" title={plan.status === 'conflict' ? 'Plan no longer fits your flight' : 'Zero spare days before your flight'}>{bufferMessage(plan).text}</Banner>}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/money" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface2 font-semibold"><Icon name="wallet" size={18} /> Log expense</Link>
        <Link to="/safety" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bad-soft font-semibold text-bad"><Icon name="shield" size={18} /> Safety</Link>
      </div>
    </>
  )
}

function CheckRow({ label, sub, done, urgent, onClick, tone }: { label: string; sub: string; done: boolean; urgent: boolean; onClick: () => void; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl text-left">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${done ? (tone === 'bad' ? 'bg-bad-soft text-bad' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-good-soft text-good') : urgent ? 'bg-accent text-accent-fg' : 'bg-surface2 text-muted'}`}>
        <Icon name={done ? 'check' : 'heart'} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      <Icon name="right" className="text-muted" />
    </button>
  )
}

function After() {
  const s = useAll()
  const spent = s.expenses.length
  return (
    <>
      <Card className="bg-gradient-to-br from-teal/25 to-accent/20 text-center">
        <p className="text-4xl">🏔️</p>
        <h2 className="mt-2 text-2xl font-bold">Trek complete!</h2>
        <p className="text-sm text-muted">{spent} expenses and {Object.keys(s.checkins).length} days of check-ins saved on this phone.</p>
      </Card>
      <Link to="/money" className="block rounded-xl bg-surface2 p-4 text-center font-semibold">See your trip spending</Link>
      <Link to="/settings" className="block rounded-xl bg-surface2 p-4 text-center font-semibold">Export a backup of your trip</Link>
    </>
  )
}
