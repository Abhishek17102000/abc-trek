import type { Tier } from './trek'

export type Cat = 'docs' | 'cash' | 'health' | 'clothing' | 'gear' | 'tech' | 'trip'
export const CAT_LABEL: Record<Cat, string> = {
  docs: 'Documents & permits',
  cash: 'Money',
  health: 'Health & first aid',
  clothing: 'Clothing',
  gear: 'Gear',
  tech: 'Phone & power',
  trip: 'Bookings & plans',
}

export interface Item {
  id: string
  text: string
  cat: Cat
  /** Days before arrival in Kathmandu by which this should be done (0 = on the day you fly). */
  due?: number
  /** Approximate pack weight in grams (for the weight meter). */
  grams?: number
  /** Can be rented in Kathmandu / Pokhara instead of bought or carried from home. */
  rent?: boolean
  essential?: boolean
  note?: string
}

export const ITEMS: Item[] = [
  // Documents
  { id: 'passport', text: 'Passport (best ID for the flight and all permits)', cat: 'docs', due: 4, essential: true, note: 'Voter ID is also reported to work; Aadhaar alone does not.' },
  { id: 'idcopy', text: 'Photocopy + phone photo of passport, kept separately', cat: 'docs', due: 3 },
  { id: 'photos', text: '4 passport-size photos (permits)', cat: 'docs', due: 3, essential: true, grams: 10 },
  { id: 'insurance', text: 'Travel insurance that covers trekking to 4,500 m and helicopter evacuation', cat: 'docs', due: 4, essential: true, note: 'Save the 24h helpline in your phone and in the Safety tab.' },
  { id: 'tickets', text: 'Flight tickets saved offline (PDF + screenshot)', cat: 'docs', due: 2 },
  // Money
  { id: 'inr', text: 'Indian ₹100 / ₹200 / ₹500 notes (new series, in good condition; max ₹25,000)', cat: 'cash', due: 3, essential: true },
  { id: 'atm', text: 'Debit card with international withdrawals on; tell your bank about Nepal', cat: 'cash', due: 3, essential: true },
  { id: 'npr', text: 'Withdraw trail cash in Pokhara: no ATMs above it (see Money for an estimate)', cat: 'cash', note: 'Do this in Pokhara before the jeep.' },
  // Health
  { id: 'doctor', text: 'Talk to a doctor about altitude medication (e.g. Diamox) and your own medicines', cat: 'health', due: 4, essential: true, note: 'Do not start altitude medication without medical advice.' },
  { id: 'firstaid', text: 'First-aid kit: blister tape, plasters, ORS, pain relief, antiseptic, personal meds', cat: 'health', due: 2, grams: 300, essential: true },
  { id: 'water', text: 'Water purification: Sawyer Squeeze or tablets', cat: 'health', due: 2, grams: 100, essential: true },
  { id: 'sunscreen', text: 'SPF 50 sunscreen + lip balm', cat: 'health', due: 2, grams: 120 },
  { id: 'kneecap', text: 'Knee support / trekking poles for the descents', cat: 'health', due: 3, grams: 500 },
  // Clothing
  { id: 'down', text: 'Down jacket (rate for -10 °C)', cat: 'clothing', grams: 600, rent: true, essential: true },
  { id: 'fleece', text: 'Fleece jacket', cat: 'clothing', grams: 400 },
  { id: 'shell', text: 'Waterproof / windproof shell', cat: 'clothing', grams: 400, essential: true },
  { id: 'baselayers', text: '2 thermal base layers (top + bottom)', cat: 'clothing', grams: 450, essential: true },
  { id: 'tees', text: '2 moisture-wicking T-shirts', cat: 'clothing', grams: 300 },
  { id: 'pants', text: '1–2 hiking pants', cat: 'clothing', grams: 600 },
  { id: 'socks', text: '3 pairs merino wool socks', cat: 'clothing', grams: 250, essential: true },
  { id: 'gloves', text: 'Warm gloves + beanie', cat: 'clothing', grams: 160, essential: true },
  { id: 'sunhat', text: 'Sun hat + polarized Category-3 sunglasses', cat: 'clothing', grams: 120, essential: true },
  { id: 'boots', text: 'Broken-in trekking boots (wear them on the flight)', cat: 'clothing', essential: true, note: 'Worn, not packed: not counted in pack weight.' },
  { id: 'slippers', text: 'Light slippers for teahouses', cat: 'clothing', grams: 200 },
  // Gear
  { id: 'pack', text: 'Backpack 35–45 L with rain cover', cat: 'gear', grams: 1300, essential: true },
  { id: 'bag', text: 'Sleeping bag rated -10 °C (or rent in Pokhara) + liner', cat: 'gear', grams: 1400, rent: true, essential: true },
  { id: 'headlamp', text: 'Headlamp + spare batteries', cat: 'gear', grams: 100, essential: true },
  { id: 'bottles', text: '2 × 1 L water bottles (one insulated or inside the sleeping bag at night)', cat: 'gear', grams: 250 },
  { id: 'towel', text: 'Quick-dry towel, wet wipes, sanitiser, toiletries', cat: 'gear', grams: 400 },
  { id: 'snacks', text: 'Snacks: nuts, chocolate, energy bars', cat: 'gear', grams: 500 },
  { id: 'dry', text: 'Dry bags / zip bags for electronics and documents', cat: 'gear', grams: 100 },
  // Tech
  { id: 'powerbank', text: '20,000 mAh power bank (charging costs NPR ~200-500 per device up high)', cat: 'tech', grams: 450, essential: true },
  { id: 'cables', text: 'Cables + a multi-port charger', cat: 'tech', grams: 150 },
  { id: 'maps', text: 'Offline maps downloaded (Organic Maps / Google Maps) for Pokhara–ABC', cat: 'tech', due: 2, essential: true },
  { id: 'pwa', text: 'Install this app to your home screen while you have internet', cat: 'tech', due: 3, essential: true },
  { id: 'sim', text: 'Local SIM or eSIM (airport counters usually need passport + photo)', cat: 'tech', due: 0 },
  // Trip
  { id: 'returnflight', text: 'Confirm your return flight TIME in Settings; it decides how much buffer you have', cat: 'trip', due: 4, essential: true },
  { id: 'pokharastay', text: 'Book Pokhara hotel for the first night and the night you return from the trek', cat: 'trip', due: 3, essential: true },
  { id: 'ktmstay', text: 'Book Kathmandu hotel for arrival night', cat: 'trip', due: 3 },
  { id: 'busbook', text: 'Book Kathmandu → Pokhara bus or flight', cat: 'trip', due: 2, essential: true },
  { id: 'family', text: 'Share your plan and emergency card with family (Safety tab → Share)', cat: 'trip', due: 2, essential: true },
]

// ───────── Stays ─────────
export interface Stay {
  name: string
  area: string
  tier: Tier
  note: string
}

export const STAYS: Record<'ktm' | 'pkr', Stay[]> = {
  ktm: [
    { name: 'Zostel Kathmandu', area: 'Thamel', tier: 'budget', note: 'Social hostel with dorms and private rooms: easy for solo travellers.' },
    { name: 'Kathmandu Guest House', area: 'Thamel', tier: 'comfort', note: 'Long-running, well-located guesthouse with a quiet garden.' },
    { name: 'Hyatt Regency Kathmandu', area: 'Boudha', tier: 'luxury', note: 'Large resort-style hotel; good for a restful last night.' },
    { name: "Dwarika's Hotel", area: 'Battisputali', tier: 'luxury', note: 'Heritage-style luxury hotel.' },
  ],
  pkr: [
    { name: 'Zostel Pokhara', area: 'Lakeside', tier: 'budget', note: 'Hostel near the lake; good place to meet trekking partners.' },
    { name: 'Hotel Barahi', area: 'Lakeside', tier: 'comfort', note: 'Lakefront hotel with a pool; popular for post-trek recovery.' },
    { name: 'Temple Tree Resort & Spa', area: 'Lakeside', tier: 'comfort', note: 'Boutique resort with a spa for tired legs.' },
    { name: 'Fish Tail Lodge', area: 'Phewa Lake', tier: 'luxury', note: 'Reached by boat across Phewa Lake.' },
    { name: 'Tiger Mountain Pokhara Lodge', area: 'Hill-top', tier: 'luxury', note: 'Mountain-view lodge outside town.' },
  ],
}

export const TRAIL_STAY_TIPS = [
  'Trail teahouses are walk-in and first-come, first-served. Rooms are cheap (often free if you eat dinner and breakfast there). Names on the trail change; ask the owner of the lodge you leave to phone ahead for the next village.',
  'At Chhomrong, choose a lodge on the upper ridge for the best views. At MBC and ABC, arrive by early afternoon: beds run out in peak season.',
  'Luxury on the trail means a private room, attached bathroom (where available) and an electric blanket. Ask when you check in; some higher lodges have none.',
  'Order dinner and breakfast when you arrive. Menus are fixed-price per village; the same dal bhat costs more as you climb.',
]

// ───────── Cost model (NPR; rough, editable in the app) ─────────
export const NPR_PER_INR = 1.6 // official peg

export interface TierPrices {
  cityNight: { ktm: number; pkr: number }
  cityFoodPerDay: number
  localTransport: number
  jeepReturn: number
  trailPerDay: number
  gear: number
  busOneWay: number
}

export const PRICES: Record<Tier, TierPrices> = {
  budget: { cityNight: { ktm: 1200, pkr: 1200 }, cityFoodPerDay: 1500, localTransport: 1500, jeepReturn: 4000, trailPerDay: 3200, gear: 3000, busOneWay: 1200 },
  comfort: { cityNight: { ktm: 6000, pkr: 5500 }, cityFoodPerDay: 2500, localTransport: 3000, jeepReturn: 5000, trailPerDay: 4800, gear: 8000, busOneWay: 2500 },
  luxury: { cityNight: { ktm: 22000, pkr: 20000 }, cityFoodPerDay: 4500, localTransport: 6000, jeepReturn: 14000, trailPerDay: 7000, gear: 20000, busOneWay: 2500 },
}

export const FLIGHT_ONE_WAY_NPR = 16000
export const ACAP_NPR = 1000
export const TIMS_NPR = 600
export const GUIDE_PER_DAY_NPR = 4000
