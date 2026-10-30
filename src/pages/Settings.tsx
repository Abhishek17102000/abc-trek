import { useRef, useState } from 'react'
import { Banner, Btn, Card, Confirm, Field, Icon, inputCls, Screen, SectionTitle, Segmented, Toggle, toast } from '../ui'
import { exportJson, importJson, resetState, setState, useAll } from '../store'
import { setTrip } from '../actions'
import { usePlan } from '../hooks'
import { bufferMessage } from '../engine/plan'
import { addDays, diffDays, isDate, todayLocal } from '../engine/dates'
import { VARIANTS, type VariantId } from '../data/trek'
import { useInstall } from '../install'
import { isNative, nativeRequestPermission, nativeTest } from '../native'

export function TripForm() {
  const s = useAll()
  const plan = usePlan()
  const t = s.trip
  const issues: string[] = []
  if (!(diffDays(t.arriveKtm, t.trekStart) >= 1)) issues.push('The trek must start at least one day after you land.')
  if (!(diffDays(t.trekStart, t.returnDate) >= 5)) issues.push('Your flight home is too soon for the trek.')
  const msg = bufferMessage(plan)

  const date = (label: string, key: 'arriveKtm' | 'trekStart' | 'returnDate') => (
    <Field label={label}>
      <input aria-label={label} type="date" className={inputCls} value={t[key]} onChange={(e) => isDate(e.target.value) && setTrip({ [key]: e.target.value })} />
    </Field>
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {date('Land in Kathmandu', 'arriveKtm')}
        {date('Start trekking', 'trekStart')}
        {date('Flight home date', 'returnDate')}
        <Field label="Flight home time" hint="Leave blank if unknown">
          <input aria-label="Flight home time" type="time" className={inputCls} value={t.returnTime} onChange={(e) => setTrip({ returnTime: e.target.value })} />
        </Field>
      </div>
      <Field label="Route">
        <Segmented label="Route" value={t.variant} onChange={(v: VariantId) => setTrip({ variant: v })} options={(Object.keys(VARIANTS) as VariantId[]).map((v) => ({ value: v, label: v === 'direct' ? '6 days · direct' : '7 days · safer' }))} />
      </Field>
      <Field label="Kathmandu → Pokhara">
        <Segmented label="Kathmandu to Pokhara" value={t.toPokhara} onChange={(v: 'bus' | 'flight') => setTrip({ toPokhara: v })} options={[{ value: 'bus', label: 'Tourist bus' }, { value: 'flight', label: 'Flight' }]} />
      </Field>
      <div className="flex items-center justify-between rounded-xl bg-surface2 px-4 py-3">
        <span className="font-medium">Hire a guide (adds to budget)</span>
        <Toggle label="Hire a guide" checked={t.guide} onChange={(v) => setTrip({ guide: v })} />
      </div>
      {issues.map((i) => (
        <Banner key={i} tone="bad" title={i} />
      ))}
      {issues.length === 0 && <Banner tone={msg.tone === 'good' ? 'good' : msg.tone === 'warn' ? 'warn' : 'bad'} icon={msg.tone === 'good' ? 'check' : 'clock'} title={`Flight buffer: ${plan.bufferDays} day${Math.abs(plan.bufferDays) === 1 ? '' : 's'}`}>{msg.text}</Banner>}
    </div>
  )
}

export default function Settings() {
  const s = useAll()
  const install = useInstall()
  const fileRef = useRef<HTMLInputElement>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [sim, setSim] = useState(s.simDate ?? '')

  const doExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abc-trek-backup-${todayLocal()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast('Backup downloaded')
  }

  return (
    <Screen title="Settings" subtitle="Everything is stored on this phone only">
      <Card className="space-y-3">
        <Field label="Your name">
          <input aria-label="Your name" className={inputCls} value={s.name} onChange={(e) => setState(() => ({ name: e.target.value }))} placeholder="Name" />
        </Field>
      </Card>

      <SectionTitle>Trip</SectionTitle>
      <Card>
        <TripForm />
      </Card>

      <SectionTitle>Daily reminders</SectionTitle>
      <Card className="space-y-3">
        {isNative() ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Morning &amp; evening check-ins</p>
                <p className="text-xs text-muted">Fire even when the app is closed, with no signal.</p>
              </div>
              <Toggle
                label="Daily reminders"
                checked={s.reminders.enabled}
                onChange={async (v) => {
                  if (v && !(await nativeRequestPermission())) return toast('Allow notifications for ABC Trek in your phone settings first')
                  setState((st) => ({ reminders: { ...st.reminders, enabled: v } }))
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Morning">
                <input aria-label="Morning reminder time" type="time" className={inputCls} value={s.reminders.morning} onChange={(e) => e.target.value && setState((st) => ({ reminders: { ...st.reminders, morning: e.target.value } }))} />
              </Field>
              <Field label="Evening">
                <input aria-label="Evening reminder time" type="time" className={inputCls} value={s.reminders.evening} onChange={(e) => e.target.value && setState((st) => ({ reminders: { ...st.reminders, evening: e.target.value } }))} />
              </Field>
            </div>
            <Btn variant="soft" block onClick={async () => toast((await nativeTest()) ? 'Test notification sent' : 'Turn on reminders first')}>
              Send a test notification
            </Btn>
          </>
        ) : (
          <p className="text-sm text-muted">Reminders that work with the app closed need the Android app (the APK on the project's Releases page). In the browser version you are prompted when you open the app.</p>
        )}
      </Card>

      <SectionTitle>Preview a day</SectionTitle>
      <Card className="space-y-3">
        <p className="text-sm text-muted">Explore how the app will look on any day of your trip, without waiting for it. Check-ins you save while previewing are real, so switch back before the trip.</p>
        <div className="flex gap-2">
          <input aria-label="Preview date" type="date" className={inputCls} value={sim} onChange={(e) => setSim(e.target.value)} />
          <Btn
            onClick={() => {
              if (!isDate(sim)) return toast('Pick a date first')
              setState(() => ({ simDate: sim }))
              toast(`Previewing ${sim}`)
            }}
          >
            Preview
          </Btn>
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
            const d = addDays(s.trip.arriveKtm, n)
            return (
              <Btn key={n} size="sm" variant="soft" onClick={() => { setSim(d); setState(() => ({ simDate: d })) }}>
                {n === 0 ? 'Arrival' : `+${n}`}
              </Btn>
            )
          })}
          <Btn size="sm" variant="ghost" disabled={!s.simDate} onClick={() => { setSim(''); setState(() => ({ simDate: null })); toast('Back to the real date') }}>
            Use real date
          </Btn>
        </div>
      </Card>

      <SectionTitle>Install on your phone</SectionTitle>
      <Card>
        {install.installed ? (
          <p className="flex items-center gap-2 text-sm"><Icon name="check" className="text-good" /> Installed: it works offline.</p>
        ) : install.canPrompt ? (
          <Btn block onClick={() => void install.prompt()}><Icon name="download" size={18} /> Install app</Btn>
        ) : install.ios ? (
          <p className="text-sm text-muted">iPhone: tap Share in Safari, then <b>Add to Home Screen</b>. Do this while you have internet so everything is saved for the mountains.</p>
        ) : (
          <p className="text-sm text-muted">Android: browser menu (⋮) → <b>Install app</b> / <b>Add to Home screen</b>. Do this while you have internet.</p>
        )}
      </Card>

      <SectionTitle>Backup</SectionTitle>
      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="soft" onClick={doExport}><Icon name="download" size={18} /> Export</Btn>
          <Btn variant="soft" onClick={() => fileRef.current?.click()}><Icon name="upload" size={18} /> Import</Btn>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Import backup file"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            toast(importJson(await f.text()) ? 'Backup restored' : "That file isn't an ABC Trek backup")
            if (fileRef.current) fileRef.current.value = ''
          }}
        />
        <Btn variant="danger" block onClick={() => setResetOpen(true)}><Icon name="trash" size={18} /> Erase everything</Btn>
      </Card>

      <Confirm open={resetOpen} danger title="Erase everything?" body="Check-ins, expenses, ticks and notes on this phone will be deleted." confirmLabel="Erase" onCancel={() => setResetOpen(false)} onConfirm={() => { resetState(); setResetOpen(false) }} />
    </Screen>
  )
}
