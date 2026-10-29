import { useState } from 'react'
import clsx from 'clsx'
import { Bar, Card, Chip, Icon, Screen, SectionTitle, Segmented } from '../ui'
import { useAll } from '../store'
import { toggleDone } from '../actions'
import { CAT_LABEL, ITEMS, type Cat, type Item } from '../data/lists'
import { addDays, fmt } from '../engine/dates'
import { useToday } from '../hooks'

const TARGET_G = 9000

export default function Pack() {
  const s = useAll()
  const today = useToday()
  const [tab, setTab] = useState<'tasks' | 'pack'>('tasks')
  const arrive = s.trip.arriveKtm
  const tasks = ITEMS.filter((i) => i.due !== undefined)
  const gear = ITEMS.filter((i) => i.grams !== undefined || i.cat === 'clothing' || i.cat === 'gear')
  const weight = gear.filter((i) => s.done[i.id] && !i.rent).reduce((a, i) => a + (i.grams ?? 0), 0)
  const totalWeight = gear.filter((i) => !i.rent).reduce((a, i) => a + (i.grams ?? 0), 0)
  const doneTasks = tasks.filter((i) => s.done[i.id]).length
  const doneAll = ITEMS.filter((i) => s.done[i.id]).length

  return (
    <Screen title="Prepare" subtitle={`${doneAll} of ${ITEMS.length} items done`}>
      <Segmented label="Prepare view" value={tab} onChange={setTab} options={[{ value: 'tasks', label: 'To-do by date' }, { value: 'pack', label: 'Packing list' }]} />
      {tab === 'tasks' ? (
        <>
          <Card className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Pre-trip tasks</span>
              <span className="text-muted">{doneTasks}/{tasks.length}</span>
            </div>
            <Bar value={doneTasks} max={tasks.length} tone="good" />
          </Card>
          {[...new Set(tasks.map((t) => t.due as number))].sort((a, b) => b - a).map((due) => {
            const date = addDays(arrive, -due)
            const list = tasks.filter((t) => t.due === due)
            return (
              <div key={due} className="space-y-1.5">
                <SectionTitle right={date < today && list.some((t) => !s.done[t.id]) ? <Chip tone="bad">Overdue</Chip> : date === today ? <Chip tone="accent">Today</Chip> : undefined}>
                  {due === 0 ? 'Departure day' : `${due} day${due > 1 ? 's' : ''} before`} · {fmt(date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </SectionTitle>
                <ItemList items={list} done={s.done} />
              </div>
            )
          })}
          <div className="space-y-1.5">
            <SectionTitle>Whenever</SectionTitle>
            <ItemList items={ITEMS.filter((i) => i.due === undefined && i.cat === 'cash')} done={s.done} />
          </div>
        </>
      ) : (
        <>
          <Card className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Packed weight</p>
                <p className="text-3xl font-bold tabular-nums">{(weight / 1000).toFixed(1)} <span className="text-base font-medium text-muted">kg</span></p>
              </div>
              <p className="text-right text-sm text-muted">Target ≤ {TARGET_G / 1000} kg<br />Full list {(totalWeight / 1000).toFixed(1)} kg</p>
            </div>
            <Bar value={weight} max={TARGET_G} tone={weight > TARGET_G ? 'bad' : 'accent'} />
            <p className="text-xs text-muted">Weights are approximate. Items marked “rent” are not counted: rent them in Pokhara and carry them only on the trek. Boots are worn, not packed.</p>
          </Card>
          {(['clothing', 'gear', 'health', 'tech', 'docs', 'cash', 'trip'] as Cat[]).map((c) => {
            const list = ITEMS.filter((i) => i.cat === c && (c === 'clothing' || c === 'gear' || c === 'health' || c === 'tech' || c === 'docs' || c === 'cash' || c === 'trip'))
            if (!list.length) return null
            return (
              <div key={c} className="space-y-1.5">
                <SectionTitle right={<span className="text-xs text-muted">{list.filter((i) => s.done[i.id]).length}/{list.length}</span>}>{CAT_LABEL[c]}</SectionTitle>
                <ItemList items={list} done={s.done} showWeight />
              </div>
            )
          })}
          <Card>
            <a href="https://www.decathlon.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <Icon name="bag" className="text-accent" />
              <span className="flex-1">
                <span className="block font-semibold">Need gear fast?</span>
                <span className="text-sm text-muted">Decathlon India (from your notes) or rent in Pokhara Lakeside.</span>
              </span>
              <Icon name="right" className="text-muted" />
            </a>
          </Card>
        </>
      )}
    </Screen>
  )
}

function ItemList({ items, done, showWeight }: { items: Item[]; done: Record<string, boolean>; showWeight?: boolean }) {
  return (
    <Card className="divide-y divide-line !p-0">
      {items.map((i) => {
        const on = !!done[i.id]
        return (
          <button key={i.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggleDone(i.id)} className="flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left">
            <span className={clsx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-good bg-good text-bg' : 'border-line')}>{on && <Icon name="check" size={14} />}</span>
            <span className="min-w-0 flex-1">
              <span className={clsx('block font-medium', on && 'text-muted line-through')}>{i.text}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {i.essential && <Chip tone="accent">essential</Chip>}
                {i.rent && <Chip tone="good">rentable</Chip>}
                {showWeight && i.grams ? <span className="text-xs text-muted">~{i.grams} g</span> : null}
                {i.note && <span className="text-xs text-muted">{i.note}</span>}
              </span>
            </span>
          </button>
        )
      })}
    </Card>
  )
}
