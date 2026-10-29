import { useState } from 'react'
import clsx from 'clsx'
import { Banner, Btn, Field, Icon, inputCls, Segmented, Sheet, toast } from '../ui'
import { assess, LEVEL_TONE, NO_FLAGS, type RedFlags, type Sev, type Symptoms } from '../engine/ams'
import { addExpense, addRestHere, saveEvening, saveMorning } from '../actions'
import { PLACES, VARIANTS } from '../data/trek'
import { EXP_CATS, type Currency, type ExpCat } from '../engine/budget'
import type { Analysis } from '../engine/plan'
import { useStore } from '../store'
import { Link } from 'react-router-dom'

const SEV: { value: Sev; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
]

const SYMPTOM_ROWS: { key: keyof Symptoms; label: string; hint: string }[] = [
  { key: 'headache', label: 'Headache', hint: 'None / mild / moderate / severe' },
  { key: 'gi', label: 'Nausea, vomiting or no appetite', hint: 'Stomach symptoms' },
  { key: 'fatigue', label: 'Unusual tiredness or weakness', hint: 'More than the walking explains' },
  { key: 'dizziness', label: 'Dizziness or light-headedness', hint: 'On standing or walking' },
]

const FLAG_ROWS: { key: keyof RedFlags; label: string }[] = [
  { key: 'ataxia', label: "I can't walk a straight heel-to-toe line / I feel clumsy" },
  { key: 'confusion', label: 'Confusion, or I am acting strangely (ask your partner)' },
  { key: 'breathlessAtRest', label: 'Short of breath while resting' },
  { key: 'wetCough', label: 'Persistent wet cough, gurgling chest or pink/frothy sputum' },
]

export function CheckInSheet({ mode, date, plan, slept, onClose }: { mode: 'morning' | 'evening'; date: string; plan: Analysis; slept: string; onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title={mode === 'morning' ? 'Morning check-in' : 'Evening check-in'}>
      {mode === 'morning' ? <Morning date={date} plan={plan} slept={slept} onClose={onClose} /> : <Evening date={date} plan={plan} onClose={onClose} />}
    </Sheet>
  )
}

function Morning({ date, plan, slept, onClose }: { date: string; plan: Analysis; slept: string; onClose: () => void }) {
  const existing = useStore((s) => s.checkins[date]?.morning)
  const [sleep, setSleep] = useState<1 | 2 | 3 | 4 | 5>(existing?.sleep ?? 3)
  const [sym, setSym] = useState<Symptoms>(existing?.symptoms ?? { headache: 0, gi: 0, fatigue: 0, dizziness: 0 })
  const [flags, setFlags] = useState<RedFlags>(existing?.flags ?? NO_FLAGS)
  const [spo2, setSpo2] = useState(existing?.spo2 ? String(existing.spo2) : '')
  const [pulse, setPulse] = useState(existing?.pulse ? String(existing.pulse) : '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [saved, setSaved] = useState(false)

  const alt = PLACES[slept]?.alt ?? 0
  const sp = spo2 ? Number(spo2) : undefined
  const a = assess(sym, flags, sp && sp > 0 ? sp : undefined, alt)
  const day = plan.days.find((d) => d.date === date)
  const canRest = day?.kind === 'trek'

  const save = () => {
    saveMorning(date, { at: Date.now(), sleep, symptoms: sym, flags, spo2: sp && sp > 0 ? sp : undefined, pulse: pulse ? Number(pulse) : undefined, note })
    setSaved(true)
    toast('Check-in saved')
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        You slept at <b className="text-ink">{PLACES[slept]?.name ?? 'your last stop'}</b> ({alt.toLocaleString()} m). Answer honestly. This decides whether it is safe to go higher today.
      </p>

      <Field label="How did you sleep?">
        <Segmented label="Sleep quality" value={sleep} onChange={setSleep} options={[1, 2, 3, 4, 5].map((n) => ({ value: n as 1 | 2 | 3 | 4 | 5, label: ['Awful', 'Poor', 'OK', 'Good', 'Great'][n - 1] }))} />
      </Field>

      {SYMPTOM_ROWS.map((r) => (
        <Field key={r.key} label={r.label}>
          <Segmented label={r.label} value={sym[r.key]} onChange={(v) => setSym({ ...sym, [r.key]: v })} options={SEV} />
        </Field>
      ))}

      <fieldset className="space-y-2 rounded-2xl bg-surface2 p-3">
        <legend className="px-1 text-sm font-semibold">Emergency signs (tick any that apply)</legend>
        {FLAG_ROWS.map((f) => (
          <label key={f.key} className="flex min-h-11 items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={flags[f.key]} onChange={(e) => setFlags({ ...flags, [f.key]: e.target.checked })} />
            <span>{f.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="SpO₂ % (optional)" hint="Oximeter, rested, warm hands">
          <input aria-label="SpO2 percent" className={inputCls} inputMode="numeric" value={spo2} onChange={(e) => setSpo2(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="e.g. 88" />
        </Field>
        <Field label="Resting pulse (optional)">
          <input aria-label="Resting pulse" className={inputCls} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="bpm" />
        </Field>
      </div>

      <Field label="Notes">
        <input aria-label="Morning notes" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Knees, blisters, appetite…" />
      </Field>

      <Banner tone={LEVEL_TONE[a.level] === 'good' ? 'good' : LEVEL_TONE[a.level] === 'warn' ? 'warn' : 'bad'} icon={a.level === 'none' ? 'check' : 'alert'} title={`${a.title} (score ${a.score})`}>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {a.actions.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Banner>

      <p className="text-xs text-muted">This is a standard self-check, not a diagnosis. If in doubt, do not go higher.</p>

      {!saved ? (
        <Btn block size="lg" onClick={save}>
          <Icon name="check" /> Save check-in
        </Btn>
      ) : (
        <div className="space-y-2">
          {a.suggestRest && canRest && (
            <Btn
              block
              onClick={() => {
                toast(addRestHere(plan, date))
                onClose()
              }}
            >
              <Icon name="bed" /> Take a rest day here
            </Btn>
          )}
          {(a.mustDescend || a.level === 'emergency') && (
            <Link to="/safety" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bad-soft px-4 font-semibold text-bad">
              <Icon name="phone" /> Open emergency numbers & card
            </Link>
          )}
          <Btn block variant="soft" onClick={onClose}>
            Done
          </Btn>
        </div>
      )}
    </div>
  )
}

function Evening({ date, plan, onClose }: { date: string; plan: Analysis; onClose: () => void }) {
  const variant = useStore((s) => s.trip.variant)
  const existing = useStore((s) => s.checkins[date]?.evening)
  const planned = plan.days.find((d) => d.date === date)?.night ?? 'pkr'
  const options = [...new Set(['ktm', 'pkr', ...VARIANTS[variant].stages.map((s) => s.to)])]
  const [place, setPlace] = useState(existing?.place ?? planned)
  const [water, setWater] = useState(existing ? String(existing.water) : '')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(existing?.mood ?? 4)
  const [weather, setWeather] = useState(existing?.weather ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [amount, setAmount] = useState('')
  const [cur, setCur] = useState<Currency>('NPR')
  const [cat, setCat] = useState<ExpCat>('food')

  const save = () => {
    saveEvening(date, { at: Date.now(), place, water: Number(water) || 0, mood, weather, note })
    const amt = Number(amount)
    if (amt > 0) addExpense({ date, amount: amt, cur, cat, note: 'Evening check-in' })
    toast(place === planned ? 'Saved. On plan ✓' : `Saved. Plan updated: you are at ${PLACES[place].name}`)
    onClose()
  }

  return (
    <div className="space-y-5">
      <Field label="Where are you sleeping tonight?" hint="If this differs from the plan, the remaining days re-flow automatically.">
        <select aria-label="Sleeping place" className={inputCls} value={place} onChange={(e) => setPlace(e.target.value)}>
          {options.map((id) => (
            <option key={id} value={id}>
              {PLACES[id].name} · {PLACES[id].alt.toLocaleString()} m{id === planned ? ' (planned)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Water today (litres)">
          <input aria-label="Water litres" className={inputCls} inputMode="decimal" value={water} onChange={(e) => setWater(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="3" />
        </Field>
        <Field label="Weather">
          <input aria-label="Weather today" className={inputCls} value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Clear, cold…" />
        </Field>
      </div>
      <Field label="How was the day?">
        <Segmented label="Mood" value={mood} onChange={setMood} options={[1, 2, 3, 4, 5].map((n) => ({ value: n as 1 | 2 | 3 | 4 | 5, label: ['Rough', 'Hard', 'OK', 'Good', 'Superb'][n - 1] }))} />
      </Field>
      <Field label="Spent today (optional)">
        <div className="flex gap-2">
          <input aria-label="Amount spent" className={clsx(inputCls, 'flex-1')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 8))} placeholder="Amount" />
          <select aria-label="Currency" className={clsx(inputCls, 'w-24')} value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            <option>NPR</option>
            <option>INR</option>
          </select>
        </div>
        <select aria-label="Spend category" className={clsx(inputCls, 'mt-2')} value={cat} onChange={(e) => setCat(e.target.value as ExpCat)}>
          {EXP_CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes for tomorrow">
        <input aria-label="Evening notes" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Early start, check the avalanche zone…" />
      </Field>
      <Btn block size="lg" onClick={save}>
        <Icon name="check" /> Save &amp; update plan
      </Btn>
    </div>
  )
}
