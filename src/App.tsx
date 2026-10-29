import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Banner, Btn, Card, Field, Icon, inputCls, Toaster, type IconName } from './ui'
import { setState, useAll } from './store'
import { TripForm } from './pages/Settings'
import Today from './pages/Today'
import Plan from './pages/Plan'
import Money from './pages/Money'
import Pack from './pages/Pack'
import Settings from './pages/Settings'
import { Facts, More, Notes, Safety, Stays } from './pages/Info'
import { useForecastLoader } from './hooks'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'sun' },
  { to: '/plan', label: 'Plan', icon: 'mountain' },
  { to: '/money', label: 'Money', icon: 'wallet' },
  { to: '/pack', label: 'Prepare', icon: 'bag' },
  { to: '/more', label: 'More', icon: 'more' },
]

function TabBar() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-xl">
      <ul className="safe-bottom mx-auto flex max-w-xl px-2 pt-1.5">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => clsx('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold', isActive ? 'text-accent' : 'text-muted')}>
              {({ isActive }) => (
                <>
                  <span className={clsx('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-accent-soft')}>
                    <Icon name={t.icon} size={22} />
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Welcome() {
  const s = useAll()
  return (
    <div className="rise mx-auto max-w-xl space-y-5 px-5 pb-10 safe-top">
      <div className="pt-4">
        <p className="text-4xl">🏔️</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">ABC Trek Companion</h1>
        <p className="mt-1 text-muted">Your day-by-day plan, daily health check-ins, budget and packing list for Annapurna Base Camp. It works offline and keeps everything on your phone.</p>
      </div>
      <Field label="What should I call you?">
        <input aria-label="Your name" className={inputCls} value={s.name} onChange={(e) => setState(() => ({ name: e.target.value }))} placeholder="Name (optional)" />
      </Field>
      <Card>
        <p className="mb-3 font-semibold">Your trip</p>
        <TripForm />
      </Card>
      <Banner tone="accent" icon="info" title="Check the dates, then continue">
        They are pre-filled from the flight in your notes (arrive 2 Nov, home 10 Nov). Add your flight time so I can check the buffer.
      </Banner>
      <Btn block size="lg" onClick={() => setState(() => ({ onboarded: true }))}>
        Start planning <Icon name="right" size={20} />
      </Btn>
    </div>
  )
}

export default function App() {
  const s = useAll()
  const loc = useLocation()
  useForecastLoader()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])

  if (!s.onboarded) {
    return (
      <>
        <Welcome />
        <Toaster />
      </>
    )
  }
  return (
    <>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/money" element={<Money />} />
        <Route path="/pack" element={<Pack />} />
        <Route path="/more" element={<More />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/facts" element={<Facts />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
      <Toaster />
    </>
  )
}
