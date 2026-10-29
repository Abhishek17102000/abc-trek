import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Bar, Btn, Card, Chip, Field, Icon, inputCls, Screen, SectionTitle, Segmented, Sheet, toast } from '../ui'
import { setState, useAll } from '../store'
import { usePlan, useToday } from '../hooks'
import { EXP_CATS, estimate, fmtInr, fmtNpr, summarize, toInr, toNpr, type Currency, type EstLine, type ExpCat } from '../engine/budget'
import { addExpense, deleteExpense, setTrip } from '../actions'
import { fmt } from '../engine/dates'
import type { Tier } from '../data/trek'

export default function Money() {
  const s = useAll()
  const plan = usePlan()
  const today = useToday()
  const [edit, setEdit] = useState<EstLine | null>(null)
  const [showLines, setShowLines] = useState(false)

  const lines = useMemo(() => estimate(s.trip, plan, s.priceOverrides), [s.trip, plan, s.priceOverrides])
  const sum = summarize(lines, s.expenses)
  const over = sum.spentNpr > sum.estimateNpr

  const [amount, setAmount] = useState('')
  const [cur, setCur] = useState<Currency>('NPR')
  const [cat, setCat] = useState<ExpCat>('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today)

  const submit = () => {
    const n = Number(amount)
    if (!(n > 0)) return toast('Enter an amount first')
    addExpense({ date, amount: n, cur, cat, note: note.trim() })
    setAmount('')
    setNote('')
    toast('Expense added')
  }

  const grouped = useMemo(() => {
    const m = new Map<string, typeof s.expenses>()
    for (const e of [...s.expenses].sort((a, b) => (a.date < b.date ? 1 : -1))) m.set(e.date, [...(m.get(e.date) ?? []), e])
    return [...m.entries()]
  }, [s.expenses])

  const remainingDays = Math.max(1, plan.days.filter((d) => d.date >= today).length)

  return (
    <Screen title="Money" subtitle="Estimate, track and stay on budget">
      <Card className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Spent</p>
            <p className="text-3xl font-bold tabular-nums">{fmtNpr(sum.spentNpr)}</p>
            <p className="text-sm text-muted">{fmtInr(toInr(sum.spentNpr))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Estimate</p>
            <p className="text-xl font-bold tabular-nums">{fmtNpr(sum.estimateNpr)}</p>
            <p className="text-sm text-muted">{fmtInr(toInr(sum.estimateNpr))}</p>
          </div>
        </div>
        <Bar value={sum.spentNpr} max={sum.estimateNpr} tone={over ? 'bad' : 'accent'} />
        <p className="text-sm text-muted">
          {over ? `Over the estimate by ${fmtNpr(-sum.remainingNpr)}.` : `${fmtNpr(sum.remainingNpr)} left · about ${fmtNpr(Math.max(0, sum.remainingNpr) / remainingDays)} per remaining day.`} 1 INR = 1.6 NPR (fixed rate).
        </p>
        <Segmented label="Comfort level" value={s.trip.tier} onChange={(t: Tier) => setTrip({ tier: t })} options={[{ value: 'budget', label: 'Budget' }, { value: 'comfort', label: 'Comfort' }, { value: 'luxury', label: 'Luxury' }]} />
        <div className="flex flex-wrap gap-2">
          {EXP_CATS.filter((c) => sum.byCat[c.id] > 0).map((c) => (
            <Chip key={c.id}>{c.label} {fmtNpr(sum.byCat[c.id])}</Chip>
          ))}
        </div>
      </Card>

      <SectionTitle>Add an expense</SectionTitle>
      <Card className="space-y-3">
        <div className="flex gap-2">
          <input aria-label="Expense amount" className={clsx(inputCls, 'flex-1 text-xl font-semibold')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 8))} placeholder="Amount" />
          <select aria-label="Expense currency" className={clsx(inputCls, 'w-24')} value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            <option>NPR</option>
            <option>INR</option>
          </select>
        </div>
        {amount && Number(amount) > 0 && <p className="text-xs text-muted">≈ {cur === 'NPR' ? fmtInr(toInr(Number(amount))) : fmtNpr(toNpr(Number(amount), 'INR'))}</p>}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
          {EXP_CATS.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} onClick={() => setCat(c.id)} className={clsx('min-h-9 rounded-full px-3 text-sm font-semibold', cat === c.id ? 'bg-accent text-accent-fg' : 'bg-surface2 text-muted')}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Expense note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (dal bhat, jeep…)" />
          <input aria-label="Expense date" type="date" className={inputCls} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <Btn block onClick={submit}>
          <Icon name="plus" size={18} /> Add expense
        </Btn>
      </Card>

      {grouped.length > 0 && (
        <>
          <SectionTitle>History</SectionTitle>
          {grouped.map(([d, list]) => (
            <Card key={d} className="!p-0">
              <div className="flex items-center justify-between px-4 pt-3 text-sm">
                <span className="font-semibold">{fmt(d)}</span>
                <span className="text-muted tabular-nums">{fmtNpr(list.reduce((a, e) => a + toNpr(e.amount, e.cur), 0))}</span>
              </div>
              <ul className="divide-y divide-line">
                {list.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tabular-nums">
                        {e.cur === 'INR' ? '₹' : 'NPR '}
                        {e.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {EXP_CATS.find((c) => c.id === e.cat)?.label}
                        {e.note && ` · ${e.note}`}
                      </span>
                    </span>
                    <button type="button" aria-label={`Delete expense ${e.note || e.amount}`} onClick={() => deleteExpense(e.id)} className="grid h-9 w-9 place-items-center rounded-full text-muted">
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}

      <SectionTitle right={<button type="button" className="text-sm font-semibold text-accent" onClick={() => setShowLines((v) => !v)}>{showLines ? 'Hide' : 'Show'} breakdown</button>}>Budget estimate</SectionTitle>
      {showLines && (
        <Card className="divide-y divide-line !p-0">
          {lines.map((l) => (
            <button key={l.id} type="button" disabled={l.id === 'buffer'} onClick={() => setEdit(l)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{l.label}</span>
                <span className="block text-xs text-muted">
                  {l.qty} × {fmtNpr(l.unit)}{l.custom ? ' (edited)' : ''}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{fmtNpr(l.qty * l.unit)}</span>
            </button>
          ))}
        </Card>
      )}
      <p className="px-1 text-xs text-muted">Estimates are rough ranges from trekker reports, not quotes. Tap a line to replace it with a real price. Flights and travel insurance are not included: add them as expenses.</p>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.label}>
        {edit && <EditLine line={edit} onClose={() => setEdit(null)} />}
      </Sheet>
    </Screen>
  )
}

function EditLine({ line, onClose }: { line: EstLine; onClose: () => void }) {
  const [v, setV] = useState(String(line.unit))
  return (
    <div className="space-y-4">
      {line.note && <p className="text-sm text-muted">{line.note}</p>}
      <Field label={`Price per unit (NPR) × ${line.qty}`}>
        <input aria-label="Unit price in NPR" className={inputCls} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^\d.]/g, '').slice(0, 8))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Btn
          variant="soft"
          onClick={() => {
            setState((s) => {
              const o = { ...s.priceOverrides }
              delete o[line.id]
              return { priceOverrides: o }
            })
            onClose()
          }}
        >
          Reset
        </Btn>
        <Btn
          onClick={() => {
            const n = Number(v)
            if (!(n >= 0)) return
            setState((s) => ({ priceOverrides: { ...s.priceOverrides, [line.id]: n } }))
            onClose()
          }}
        >
          Save
        </Btn>
      </div>
    </div>
  )
}
