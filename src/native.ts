import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useStore } from './store'
import { usePlan, useToday } from './hooks'
import { notificationId, planReminders, type PlannedReminder } from './engine/reminders'

/** True inside the Android app, false in a normal browser. */
export const isNative = (): boolean => Capacitor.isNativePlatform()

const CHANNEL = 'checkins'

async function ensureChannel() {
  try {
    await LocalNotifications.createChannel({ id: CHANNEL, name: 'Daily check-ins', description: 'Morning health check and evening log', importance: 4, vibration: true })
  } catch {
    /* already exists */
  }
}

export async function nativePermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    const s = await LocalNotifications.checkPermissions()
    return s.display === 'granted' ? 'granted' : s.display === 'denied' ? 'denied' : 'default'
  } catch {
    return 'denied'
  }
}

export async function nativeRequestPermission(): Promise<boolean> {
  try {
    return (await LocalNotifications.requestPermissions()).display === 'granted'
  } catch {
    return false
  }
}

export async function nativeTest(): Promise<boolean> {
  try {
    await ensureChannel()
    await LocalNotifications.schedule({
      notifications: [{ id: Math.floor(Math.random() * 2e9), title: 'ABC Trek test', body: 'Reminders are working 🏔️', channelId: CHANNEL, smallIcon: 'ic_stat_abctrek', schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true } }],
    })
    return true
  } catch {
    return false
  }
}

const at = (date: string, minutes: number) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0)
}

async function cancelAll() {
  try {
    const { notifications } = await LocalNotifications.getPending()
    if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) })
  } catch {
    /* nothing pending */
  }
}

export async function syncNative(list: PlannedReminder[], now = new Date()): Promise<number> {
  await cancelAll()
  const items = list.map((r) => ({ r, when: at(r.date, r.minutes) })).filter((x) => x.when.getTime() > now.getTime() + 5000).slice(0, 60)
  if (!items.length) return 0
  await ensureChannel()
  await LocalNotifications.schedule({
    notifications: items.map(({ r, when }) => ({ id: notificationId(r.id), title: r.title, body: r.body, channelId: CHANNEL, smallIcon: 'ic_stat_abctrek', schedule: { at: when, allowWhileIdle: true } })),
  })
  return items.length
}

/** Android app only: keeps the next two weeks of reminders scheduled with the phone, so they fire with the app closed. */
export function useNativeReminders(): void {
  const plan = usePlan()
  const today = useToday()
  const prefs = useStore((s) => s.reminders)
  const checkins = useStore((s) => s.checkins)
  const last = useRef('')
  useEffect(() => {
    if (!isNative()) return
    const list = prefs.enabled ? planReminders(plan, checkins, prefs, today) : []
    const sig = JSON.stringify(list.map((r) => [r.id, r.date, r.minutes]))
    if (sig === last.current) return
    last.current = sig
    void (list.length ? syncNative(list) : cancelAll())
  }, [plan, checkins, prefs, today])
}
