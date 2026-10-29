import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Banner, Btn, Card, Chip, Field, Icon, inputCls, Screen, SectionTitle, Segmented, Toggle, toast } from '../ui'
import { setState, useAll } from '../store'
import { usePlan } from '../hooks'
import { setTrip } from '../actions'
import { buildShareText } from '../engine/share'
import { EMERGENCY, FACTS, VARIANTS } from '../data/trek'
import { STAYS, TRAIL_STAY_TIPS } from '../data/lists'
import { PLACES } from '../data/trek'
import type { Tier } from '../data/trek'

// ───────── More ─────────
export function More() {
  const rows: { to: string; icon: 'bed' | 'shield' | 'info' | 'edit' | 'sun'; title: string; sub: string }[] = [
    { to: '/safety', icon: 'shield', title: 'Safety & emergency card', sub: 'Altitude rules, numbers, share your plan with family' },
    { to: '/stays', icon: 'bed', title: 'Where to stay', sub: 'Budget to luxury in Kathmandu & Pokhara, trail tips' },
    { to: '/facts', icon: 'info', title: 'Facts to verify', sub: 'Permits, guide rule, cash: sources disagree' },
    { to: '/notes', icon: 'edit', title: 'Notes', sub: 'Phone numbers, lodge names, anything you need offline' },
    { to: '/settings', icon: 'sun', title: 'Settings & backup', sub: 'Dates, flight time, route, preview any day' },
  ]
  return (
    <Screen title="More">
      <Card className="divide-y divide-line !p-0">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface2 text-accent">
              <Icon name={r.icon} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{r.title}</span>
              <span className="block text-sm text-muted">{r.sub}</span>
            </span>
            <Icon name="right" className="text-muted" />
          </Link>
        ))}
      </Card>
    </Screen>
  )
}

// ───────── Stays ─────────
export function Stays() {
  const s = useAll()
  const tier = s.trip.tier
  const order: Tier[] = ['budget', 'comfort', 'luxury']
  const pick = (list: typeof STAYS.ktm) => list.filter((x) => x.tier === tier)
  return (
    <Screen title="Where to stay" subtitle="Prices and availability change: always check">
      <Segmented label="Comfort level" value={tier} onChange={(t: Tier) => setTrip({ tier: t })} options={order.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />
      {(['ktm', 'pkr'] as const).map((c) => (
        <div key={c} className="space-y-1.5">
          <SectionTitle>{PLACES[c].name}</SectionTitle>
          {pick(STAYS[c]).length === 0 && <Card><p className="text-sm text-muted">No picks for this level here. Try the neighbouring one.</p></Card>}
          {pick(STAYS[c]).map((h) => (
            <Card key={h.name}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{h.name}</p>
                <Chip>{h.area}</Chip>
              </div>
              <p className="mt-1 text-sm text-muted">{h.note}</p>
              <a className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${PLACES[c].name}`)}`} target="_blank" rel="noopener noreferrer">
                <Icon name="map" size={14} /> Open in Maps
              </a>
            </Card>
          ))}
        </div>
      ))}
      <SectionTitle>On the trail</SectionTitle>
      <Card className="space-y-3">
        {TRAIL_STAY_TIPS.map((t) => (
          <p key={t} className="text-sm">• {t}</p>
        ))}
      </Card>
      <SectionTitle>Where you will sleep</SectionTitle>
      <Card className="divide-y divide-line !p-0">
        {VARIANTS[s.trip.variant].stages.map((st) => (
          <div key={st.id} className="px-4 py-3">
            <p className="font-semibold">{PLACES[st.to].name} · {PLACES[st.to].alt.toLocaleString()} m</p>
            <p className="text-xs text-muted">Wi-Fi {PLACES[st.to].services.wifi} · charging {PLACES[st.to].services.charging} · shower {PLACES[st.to].services.shower}</p>
          </div>
        ))}
      </Card>
      <p className="px-1 text-xs text-muted">Named hotels are well-known options, not endorsements or availability checks. No trail lodges are named because teahouse ownership and names change often and I could not verify them: ask in the village.</p>
    </Screen>
  )
}

// ───────── Safety ─────────
export function Safety() {
  const s = useAll()
  const plan = usePlan()
  const e = s.emergency
  const set = (patch: Partial<typeof e>) => setState((st) => ({ emergency: { ...st.emergency, ...patch } }))
  const text = buildShareText(s, plan)

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'My ABC trek plan', text })
      else {
        await navigator.clipboard.writeText(text)
        toast('Copied: paste it into WhatsApp or SMS')
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <Screen title="Safety" subtitle="Read this before you go. Works offline.">
      <Banner tone="bad" icon="phone" title="Emergency numbers (Nepal)">
        <div className="mt-2 grid grid-cols-1 gap-2">
          {EMERGENCY.map((n) => (
            <a key={n.number} href={`tel:${n.number}`} className="flex min-h-12 items-center justify-between rounded-xl bg-bg px-3 font-semibold text-ink">
              <span>{n.label}</span>
              <span className="tabular-nums text-bad">{n.number}</span>
            </a>
          ))}
          {e.helpline && (
            <a href={`tel:${e.helpline.replace(/\s/g, '')}`} className="flex min-h-12 items-center justify-between rounded-xl bg-bg px-3 font-semibold text-ink">
              <span>Insurer helpline</span>
              <span className="tabular-nums text-bad">{e.helpline}</span>
            </a>
          )}
        </div>
        <p className="mt-2 text-xs">Numbers as commonly published; save your insurer's 24-hour helpline below. Mobile signal is patchy above Chhomrong; lodge owners can usually call for help.</p>
      </Banner>

      <SectionTitle>Altitude golden rules</SectionTitle>
      <Card className="space-y-2 text-sm">
        {[
          'Above 3,000 m, sleep no more than ~500 m higher than the night before. Take a rest day every ~1,000 m of gain.',
          '“Climb high, sleep low”: a short walk higher in the afternoon, then come back down to sleep.',
          'Drink 3–4 L a day, eat well, and avoid alcohol and sleeping pills.',
          'Never go higher with symptoms of AMS. Mild symptoms: rest. Getting worse or any red flag: go down, now.',
          'Never leave a sick person alone. Descent is the most effective treatment.',
          'Do not take altitude medicine without medical advice; it is not a license to ascend with symptoms.',
        ].map((t) => (
          <p key={t}>• {t}</p>
        ))}
      </Card>
      <Card tone="bad" className="space-y-1 text-sm">
        <p className="font-semibold text-bad">Descend immediately and get help if you have:</p>
        <p>• Confusion, drunk-like walking or loss of balance</p>
        <p>• Breathlessness at rest, a wet or bubbling cough, pink/frothy sputum</p>
        <p>• Headache that does not respond to rest and fluids, with repeated vomiting</p>
      </Card>

      <SectionTitle>Emergency card</SectionTitle>
      <Card className="space-y-3">
        <p className="text-xs text-muted">Stored only on this phone. Show it to lodge staff, rescuers or doctors.</p>
        {([
          ['name', 'Full name'],
          ['bloodGroup', 'Blood group'],
          ['allergies', 'Allergies'],
          ['medicines', 'Regular medicines'],
          ['contact1', 'Emergency contact 1'],
          ['contact1Phone', 'Phone (with country code)'],
          ['contact2', 'Emergency contact 2'],
          ['contact2Phone', 'Phone (with country code)'],
          ['insurer', 'Travel insurer'],
          ['policy', 'Policy number'],
          ['helpline', '24h helpline (with country code)'],
          ['hotelPokhara', 'Pokhara hotel & phone'],
        ] as const).map(([k, label]) => (
          <Field key={k} label={label}>
            <input aria-label={label} className={inputCls} value={e[k]} onChange={(ev) => set({ [k]: ev.target.value })} inputMode={k.toLowerCase().includes('phone') || k === 'helpline' ? 'tel' : 'text'} />
          </Field>
        ))}
      </Card>

      <SectionTitle>Share with family</SectionTitle>
      <Card className="space-y-3">
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-surface2 p-3 text-xs">{text}</pre>
        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={() => void share()}>
            <Icon name="share" size={18} /> Share
          </Btn>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface2 px-4 font-semibold">
            WhatsApp
          </a>
        </div>
        <p className="text-xs text-muted">Nothing is sent automatically: you choose where it goes. Re-share after each check-in so family know your last stop.</p>
      </Card>
    </Screen>
  )
}

// ───────── Facts ─────────
export function Facts() {
  const s = useAll()
  const tone = { confirmed: 'good', conflicting: 'bad', estimate: 'warn' } as const
  return (
    <Screen title="Facts to verify" subtitle="What I could and could not confirm">
      <p className="text-sm text-muted">Your pasted notes and my web checks agree on most things but conflict on a few important ones. Tick each one when you have confirmed it.</p>
      {FACTS.map((f) => (
        <Card key={f.id} tone={s.verified[f.id] ? 'good' : undefined} className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{f.topic}</p>
            <Chip tone={tone[f.confidence]}>{f.confidence === 'conflicting' ? 'sources conflict' : f.confidence}</Chip>
          </div>
          <p className="text-sm">{f.claim}</p>
          <p className="text-sm font-medium text-accent">→ {f.action}</p>
          {f.links?.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-teal underline">
              {l.label}
            </a>
          ))}
          <label className="flex min-h-11 items-center justify-between rounded-xl bg-surface2 px-3 text-sm font-medium">
            I have verified this
            <Toggle label={`Verified: ${f.topic}`} checked={!!s.verified[f.id]} onChange={(v) => setState((st) => ({ verified: { ...st.verified, [f.id]: v } }))} />
          </label>
        </Card>
      ))}
    </Screen>
  )
}

// ───────── Notes ─────────
export function Notes() {
  const n = useAll().notes
  return (
    <Screen title="Notes" subtitle="Saved on this phone, available offline">
      <textarea aria-label="Trip notes" className={clsx(inputCls, 'min-h-[60dvh] py-3')} value={n} onChange={(e) => setState(() => ({ notes: e.target.value }))} placeholder="Lodge phone numbers, guide contact, jeep fare quoted, what the ACAP officer said…" />
    </Screen>
  )
}
