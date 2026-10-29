// End-to-end tests against the production build (`npm run e2e` builds first). Uses system Chrome via playwright-core.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium, devices } from 'playwright-core'

const PORT = 4189
const URL = `http://127.0.0.1:${PORT}/`
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p))
const SHOTS = process.env.SHOTS_DIR || 'e2e/shots'
mkdirSync(SHOTS, { recursive: true })

let server
let browser

before(async () => {
  assert.ok(CHROME, 'No Chrome/Edge found. Set CHROME_PATH.')
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(URL)).ok) break
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-proxy-server'] })
})

after(async () => {
  await browser?.close()
  server?.kill()
})

const WX = (min, max) => ({
  daily: {
    time: Array.from({ length: 16 }, (_, i) => `2026-11-${String(1 + i).padStart(2, '0')}`).filter((d) => d <= '2026-11-16'),
    temperature_2m_max: Array(16).fill(max),
    temperature_2m_min: Array(16).fill(min),
    precipitation_sum: Array(16).fill(0),
    snowfall_sum: Array(16).fill(0),
    wind_speed_10m_max: Array(16).fill(12),
    weather_code: Array(16).fill(0),
  },
})

async function freshPage(iso = '2026-10-29T10:00:00+05:30', { weather = true } = {}) {
  const context = await browser.newContext({ ...devices['Pixel 7'], timezoneId: 'Asia/Kolkata', locale: 'en-IN', acceptDownloads: true })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text()) && errors.push(`console: ${m.text()}`))
  if (weather) await page.route('**/api.open-meteo.com/**', (r) => r.fulfill({ json: WX(-6, 4) }))
  else await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.clock.setFixedTime(new Date(iso))
  await page.goto(URL)
  return { context, page, errors }
}

async function start(page, name = 'Asha') {
  await page.getByLabel('Your name').fill(name)
  await page.getByRole('button', { name: /Start planning/ }).click()
  await page.getByRole('navigation', { name: 'Main' }).waitFor()
}

/** Opens Settings and previews the day `+n` after arrival, then returns to Today. */
async function preview(page, n) {
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Settings & backup/ }).click()
  await page.getByRole('button', { name: n === 0 ? 'Arrival' : `+${n}`, exact: true }).click()
  await page.getByRole('link', { name: 'Today' }).click()
}

test('first run: welcome has your dates and warns the trip is tight; Today counts down', async () => {
  const { context, page, errors } = await freshPage()
  await page.getByText('ABC Trek Companion').waitFor()
  assert.equal(await page.getByLabel('Land in Kathmandu').inputValue(), '2026-11-02')
  assert.equal(await page.getByLabel('Flight home date').inputValue(), '2026-11-10')
  await page.getByText(/Flight buffer: 0 days/).waitFor()
  await page.screenshot({ path: `${SHOTS}/01-welcome.png`, fullPage: true })
  await start(page)
  await page.getByText(/^4s*days to go$/).waitFor()
  await page.getByText('No spare day before your flight').waitFor()
  await page.getByText('Big jump in sleeping altitude').waitFor()
  await page.getByText(/Annapurna Base Camp \(ABC\) is \+900 m/).waitFor()
  await page.screenshot({ path: `${SHOTS}/02-today-before.png`, fullPage: true })
  assert.deepEqual(errors, [])
  await context.close()
})

test('tasks: ticking is remembered after a reload; overdue tasks are flagged', async () => {
  const { context, page } = await freshPage('2026-11-01T10:00:00+05:30') // the day before departure: T-1
  await start(page)
  await page.getByText(/Overdue/).first().waitFor()
  await page.getByRole('button', { name: /Passport/ }).click()
  await page.getByRole('link', { name: 'Prepare' }).click()
  await page.getByRole('checkbox', { name: /Passport/ }).waitFor()
  assert.equal(await page.getByRole('checkbox', { name: /Passport/ }).getAttribute('aria-checked'), 'true')
  await page.reload()
  await page.getByRole('checkbox', { name: /Passport/ }).waitFor()
  assert.equal(await page.getByRole('checkbox', { name: /Passport/ }).getAttribute('aria-checked'), 'true')
  await context.close()
})

test('plan: the safer route does not fit the 10 Nov flight; moving the flight fixes it; rest days shift the plan', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await page.getByRole('link', { name: 'Plan' }).click()
  await page.getByText('Flight buffer: none').waitFor()
  await page.getByRole('radio', { name: /7 days/ }).click()
  await page.getByText('Plan does not fit your flight').waitFor()
  await page.screenshot({ path: `${SHOTS}/03-plan-conflict.png`, fullPage: true })

  // move the flight home two days later in Settings
  await page.getByRole('link', { name: 'Edit dates' }).click()
  await page.getByLabel('Flight home date').fill('2026-11-12')
  await page.getByText(/Flight buffer: 1 day/).waitFor()
  await page.getByRole('link', { name: 'Today' }).click()
  await page.getByText('No spare day before your flight').waitFor({ state: 'detached' })

  // add an acclimatisation day at Deurali on the plan: consumes the buffer
  await page.getByRole('link', { name: 'Plan' }).click()
  await page.getByRole('button', { name: /More rest days at Deurali/ }).click()
  await page.getByText('Flight buffer: none').waitFor()
  await page.getByRole('button', { name: /Rest day at Deurali/ }).waitFor()
  await context.close()
})

test('daily check-in: mild AMS blocks ascent and a rest day re-plans the trip', async () => {
  const { context, page, errors } = await freshPage()
  await start(page)
  await preview(page, 3) // 5 Nov = trek day 2 (Chhomrong → Dovan)
  await page.getByText('Trek day 2 of 6').waitFor()
  await page.getByText(/Sleep: Dovan/).waitFor()
  await page.getByRole('button', { name: /Morning health check/ }).click()
  await page.getByRole('dialog', { name: 'Morning check-in' }).waitFor()
  await page.getByRole('radiogroup', { name: 'Headache' }).getByRole('radio', { name: 'Mild' }).click()
  await page.getByRole('radiogroup', { name: /Nausea/ }).getByRole('radio', { name: 'Mild' }).click()
  await page.getByRole('radiogroup', { name: /tiredness/ }).getByRole('radio', { name: 'Mild' }).click()
  await page.getByText(/Mild AMS: do not go higher today \(score 3\)/).waitFor()
  await page.screenshot({ path: `${SHOTS}/04-checkin-mild.png` })
  await page.getByRole('button', { name: /Save check-in/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Take a rest day here/ }).click()
  // the plan has shifted by a day; the trek now ends on the 10th
  await page.getByRole('link', { name: 'Plan' }).click()
  await page.getByText('Plan does not fit your flight').waitFor()
  await page.getByText(/Rest day at Chhomrong/).waitFor()
  assert.deepEqual(errors, [])
  await context.close()
})

test('daily check-in: emergency signs show the emergency path', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await preview(page, 5) // 7 Nov = ABC day
  await page.getByText('Trek day 4 of 6').waitFor()
  await page.getByRole('button', { name: /Morning health check/ }).click()
  await page.getByRole('checkbox', { name: /heel-to-toe/ }).check()
  await page.getByText(/Emergency signs: descend now/).waitFor()
  await page.getByRole('button', { name: /Save check-in/ }).click()
  await page.getByRole('link', { name: /Open emergency numbers/ }).click()
  await page.getByRole('heading', { name: 'Safety' }).waitFor()
  assert.equal(await page.getByRole('link', { name: /Ambulance/ }).getAttribute('href'), 'tel:102')
  await context.close()
})

test('evening check-in: sleeping somewhere else re-flows the remaining days', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await preview(page, 3) // 5 Nov: planned Dovan
  await page.getByRole('button', { name: /Evening check-in/ }).click()
  await page.getByLabel('Sleeping place').selectOption('chhomrong') // only got as far as Chhomrong... re-flow
  await page.getByRole('button', { name: /Save & update plan/ }).click()
  await page.getByText(/Plan updated/).waitFor()
  await page.getByRole('link', { name: 'Plan' }).click()
  // Dovan is now pushed to 6 Nov: Day 2 sits on the 6th
  await page.getByRole('button', { name: /Day 2: Chhomrong → Dovan/ }).waitFor()
  assert.match(await page.getByRole('button', { name: /Day 2: Chhomrong → Dovan/ }).innerText(), /6 Nov/i)
  await context.close()
})

test('money: expenses convert at the fixed rate, editing an estimate changes the total, delete works', async () => {
  const { context, page, errors } = await freshPage()
  await start(page)
  await page.getByRole('link', { name: 'Money' }).click()
  await page.getByRole('heading', { name: 'Money' }).waitFor()
  await page.getByLabel('Expense currency').selectOption('INR')
  await page.getByLabel('Expense amount').fill('1000')
  await page.getByText('≈ NPR 1,600').waitFor()
  await page.getByRole('radio', { name: 'Transport' }).click()
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByText('Expense added').waitFor()
  await page.getByText('NPR 1,600').first().waitFor()
  await page.screenshot({ path: `${SHOTS}/05-money.png`, fullPage: true })

  // estimate: show breakdown and change the jeep price
  await page.getByRole('button', { name: /Show breakdown/ }).click()
  const before = await page.locator('p.text-xl').first().innerText()
  await page.getByRole('button', { name: /Jeep to\/from trailhead/ }).click()
  await page.getByLabel('Unit price in NPR').fill('20000')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByText(/\(edited\)/).waitFor()
  assert.notEqual(await page.locator('p.text-xl').first().innerText(), before)

  await page.getByRole('button', { name: /Delete expense/ }).click()
  await page.getByText('Expense added').waitFor({ state: 'detached' }).catch(() => undefined)
  assert.equal(await page.getByRole('button', { name: /Delete expense/ }).count(), 0)
  assert.deepEqual(errors, [])
  await context.close()
})

test('packing: weight meter responds to ticks and ignores rented items', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await page.getByRole('link', { name: 'Prepare' }).click()
  await page.getByRole('radio', { name: 'Packing list' }).click()
  await page.getByText(/0\.0\s*kg/).first().waitFor()
  await page.getByRole('checkbox', { name: /Fleece jacket/ }).click() // 400 g
  await page.getByText(/0\.4\s*kg/).first().waitFor()
  await page.getByRole('checkbox', { name: /Down jacket/ }).click() // rentable: not counted
  await page.getByText(/0\.4\s*kg/).first().waitFor()
  await context.close()
})

test('safety: emergency card persists and feeds the family share text', async () => {
  const { context, page } = await freshPage()
  await start(page, 'Asha')
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Safety & emergency card/ }).click()
  await page.getByLabel('Blood group').fill('O+')
  await page.getByLabel('24h helpline (with country code)').fill('+91 1800 123 456')
  await page.getByText(/Blood group: O\+/).waitFor()
  await page.getByText(/Insurer 24h helpline: \+91 1800 123 456/).waitFor()
  await page.reload()
  assert.equal(await page.getByLabel('Blood group').inputValue(), 'O+')
  const wa = await page.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')
  assert.match(decodeURIComponent(wa), /Annapurna Base Camp trek · Asha/)
  await page.screenshot({ path: `${SHOTS}/06-safety.png`, fullPage: true })
  await context.close()
})

test('facts: shows disputed items and remembers verification', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Facts to verify/ }).click()
  await page.getByText('Do you need a guide?').waitFor()
  await page.getByText('sources conflict').first().waitFor()
  await page.getByRole('switch', { name: 'Verified: Do you need a guide?' }).click()
  await page.reload()
  assert.equal(await page.getByRole('switch', { name: 'Verified: Do you need a guide?' }).getAttribute('aria-checked'), 'true')
  await context.close()
})

test('weather: a forecast is shown for the night stop on a trek day, and survives going offline', async () => {
  const { context, page, errors } = await freshPage('2026-11-05T09:00:00+05:30')
  await start(page)
  await page.getByText('Trek day 2 of 6').waitFor()
  await page.getByText(/Clear · -6° \/ 4°C/).waitFor()
  await page.screenshot({ path: `${SHOTS}/07-today-trek.png`, fullPage: true })
  await context.setOffline(true)
  await page.reload()
  await page.getByText(/Clear · -6° \/ 4°C/).waitFor() // cached
  assert.deepEqual(errors, [])
  await context.close()
})

test('stays: tier switches the hotel list', async () => {
  const { context, page } = await freshPage()
  await start(page)
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Where to stay/ }).click()
  await page.getByRole('radio', { name: 'Comfort' }).click()
  await page.getByText('Hotel Barahi').waitFor()
  await page.getByRole('radio', { name: 'Budget' }).click()
  await page.getByText('Zostel Pokhara').waitFor()
  await page.getByRole('radio', { name: 'Luxury' }).click()
  await page.getByText('Fish Tail Lodge').waitFor()
  await context.close()
})

test('backup: export, erase, import restores the trip', async () => {
  const { context, page } = await freshPage()
  await start(page, 'Asha')
  await page.getByRole('link', { name: 'Money' }).click()
  await page.getByLabel('Expense amount').fill('250')
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByText('Expense added').waitFor()
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Settings & backup/ }).click()
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export' }).click()])
  const path = await dl.path()
  const data = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(data.app, 'abc-trek')
  assert.equal(data.state.expenses.length, 1)
  await page.getByRole('button', { name: /Erase everything/ }).click()
  await page.getByRole('button', { name: 'Erase', exact: true }).click()
  await page.getByText('ABC Trek Companion').waitFor()
  await start(page, 'Temp')
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Settings & backup/ }).click()
  await page.setInputFiles('input[aria-label="Import backup file"]', path)
  await page.getByText('Backup restored').waitFor()
  await page.getByRole('link', { name: 'Money' }).click()
  await page.getByText('NPR 250').first().waitFor()
  await page.getByRole('link', { name: 'More' }).click()
  await page.getByRole('link', { name: /Settings & backup/ }).click()
  await page.setInputFiles('input[aria-label="Import backup file"]', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') })
  await page.getByText("That file isn't an ABC Trek backup").waitFor()
  await context.close()
})

test('offline: the installed app starts with no network and keeps its data', async () => {
  const { context, page } = await freshPage()
  await start(page, 'Asha')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(async () => {
    await page.reload()
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 })
  })
  await context.setOffline(true)
  await page.reload()
  await page.getByText('days to go').waitFor()
  await page.getByRole('link', { name: 'Plan' }).click()
  await page.getByRole('heading', { name: 'Plan' }).waitFor()
  await context.close()
})

test('mobile layout: no horizontal scroll on any page at 360px', async () => {
  const { context, page } = await freshPage()
  await page.setViewportSize({ width: 360, height: 740 })
  await start(page)
  for (const tab of ['Today', 'Plan', 'Money', 'Prepare', 'More']) {
    await page.getByRole('link', { name: tab, exact: true }).click()
    await page.waitForTimeout(250)
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.ok(o <= 0, `${tab} overflows by ${o}px`)
  }
  for (const link of [/Safety & emergency card/, /Where to stay/, /Facts to verify/, /Notes/, /Settings & backup/]) {
    await page.getByRole('link', { name: 'More' }).click()
    await page.getByRole('link', { name: link }).click()
    await page.waitForTimeout(250)
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.ok(o <= 0, `${link} overflows by ${o}px`)
  }
  await context.close()
})
