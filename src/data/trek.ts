export type VariantId = 'direct' | 'safer'
export type Tier = 'budget' | 'comfort' | 'luxury'

export interface Place {
  id: string
  name: string
  alt: number
  lat: number
  lon: number
  /** What you can count on there (from trekker reports; always confirm on the ground). */
  services: { atm?: boolean; wifi: string; charging: string; shower: string }
}

// Altitudes are the commonly published figures; coordinates are approximate (used only for the weather forecast).
export const PLACES: Record<string, Place> = {
  ktm: { id: 'ktm', name: 'Kathmandu', alt: 1400, lat: 27.7172, lon: 85.324, services: { atm: true, wifi: 'good', charging: 'free', shower: 'hot' } },
  pkr: { id: 'pkr', name: 'Pokhara', alt: 820, lat: 28.2096, lon: 83.9856, services: { atm: true, wifi: 'good', charging: 'free', shower: 'hot' } },
  jhinu: { id: 'jhinu', name: 'Jhinu Danda', alt: 1780, lat: 28.3868, lon: 83.8185, services: { wifi: 'patchy', charging: 'small fee', shower: 'hot (natural hot springs nearby)' } },
  chhomrong: { id: 'chhomrong', name: 'Chhomrong', alt: 2170, lat: 28.3774, lon: 83.8236, services: { wifi: 'paid, patchy', charging: 'NPR ~200-300', shower: 'hot, small fee' } },
  bamboo: { id: 'bamboo', name: 'Bamboo', alt: 2310, lat: 28.4066, lon: 83.8531, services: { wifi: 'rare', charging: 'NPR ~300', shower: 'cold / small fee' } },
  dovan: { id: 'dovan', name: 'Dovan', alt: 2600, lat: 28.4291, lon: 83.8604, services: { wifi: 'rare', charging: 'NPR ~300', shower: 'cold / small fee' } },
  deurali: { id: 'deurali', name: 'Deurali', alt: 3230, lat: 28.4776, lon: 83.8786, services: { wifi: 'none', charging: 'NPR ~400-500', shower: 'cold; skip it' } },
  mbc: { id: 'mbc', name: 'Machhapuchhre Base Camp (MBC)', alt: 3700, lat: 28.4961, lon: 83.8758, services: { wifi: 'none', charging: 'NPR ~500', shower: 'none; skip it' } },
  abc: { id: 'abc', name: 'Annapurna Base Camp (ABC)', alt: 4130, lat: 28.53, lon: 83.878, services: { wifi: 'paid, slow', charging: 'NPR ~500+', shower: 'none; skip it' } },
}

export interface Stage {
  id: string
  title: string
  /** Where you wake up and where you sleep that night (place ids). */
  from: string
  to: string
  km: number
  hours: string
  note: string
  steps: string[]
  tips: string[]
  alerts: string[]
}

const T = (s: Stage) => s

const S_CHHOMRONG = T({
  id: 'chhomrong',
  title: 'Pokhara → Jhinu Danda → Chhomrong',
  from: 'pkr',
  to: 'chhomrong',
  km: 6,
  hours: '4–5 h trekking + ~2.5 h jeep',
  note: 'Early shared jeep from Baglung Bus Park, then a relentless stone-stair climb to Chhomrong.',
  steps: [
    'Jeep from Baglung Bus Park in Pokhara at ~06:30 (about 2.5 h) to Jhinu Danda / the trailhead.',
    'Cross the long suspension bridge, then climb the stone stairs to Chhomrong (2,170 m).',
    'Check in at the ACAP post (have the permit ready).',
  ],
  tips: [
    'Stay on the top ridge of Chhomrong: the Machhapuchhre views from the balconies are the best.',
    'Climb slowly to protect your knees on day one; poles help a lot.',
    'Order dinner and breakfast when you check in; kitchens are slow when full.',
  ],
  alerts: ['Last reliable chance for a hot shower and decent charging for several days.'],
})
const S_DOVAN = T({
  id: 'dovan',
  title: 'Chhomrong → Dovan',
  from: 'chhomrong',
  to: 'dovan',
  km: 11,
  hours: '5–6 h',
  note: 'Down to the river, back up to Sinuwa, then into bamboo and rhododendron forest.',
  steps: ['Drop down the big stair to the Chhomrong Khola and cross the bridge.', 'Climb to Sinuwa, then continue through bamboo forest to Dovan (2,600 m).'],
  tips: ['Start early to beat the afternoon cloud and cold.', 'Carry snacks and 1.5–2 L of water: long stretches have no teahouses.'],
  alerts: ['Leeches are possible in warm, wet weather; less likely in November.'],
})
const S_DEURALI = T({
  id: 'deurali',
  title: 'Dovan → Deurali',
  from: 'dovan',
  to: 'deurali',
  km: 8,
  hours: '4.5–5 h',
  note: 'A short day on paper, but it climbs ~630 m along the Modi Khola gorge.',
  steps: ['Follow the gorge past Hinku Cave and the waterfalls.', 'Arrive at Deurali (3,230 m) and settle in early.'],
  tips: [
    'After arriving, walk up 50–100 m, sit 20 minutes, then come back down to sleep ("climb high, sleep low").',
    'Drink 3–4 L through the day; urine should be pale.',
  ],
  alerts: ['From here you are above 3,000 m: take any headache seriously (see Safety).', 'Avalanche-prone ground starts above Deurali; ask lodge owners about conditions before leaving.'],
})
const S_ABC_DIRECT = T({
  id: 'abc',
  title: 'Deurali → Annapurna Base Camp',
  from: 'deurali',
  to: 'abc',
  km: 9,
  hours: '4–5 h',
  note: 'Past MBC (3,700 m) into the glacial bowl of ABC (4,130 m). Sleeping altitude jumps ~900 m.',
  steps: ['Cross the rock-fall and avalanche zone early in the day.', 'Rest at MBC, then walk ~2 h up to ABC.', 'Be in position for sunrise on Annapurna I the next morning.'],
  tips: ['Dress warmly and keep your down jacket in the daypack.', 'ABC nights can be well below freezing in November: sleep in layers, keep water bottles inside the bag.'],
  alerts: [
    'This day raises your sleeping altitude by ~900 m, well over the usual 500 m/day guideline above 3,000 m. Consider the safer variant.',
    'Do not continue up with AMS symptoms.',
  ],
})
const S_MBC = T({
  id: 'mbc',
  title: 'Deurali → MBC',
  from: 'deurali',
  to: 'mbc',
  km: 5,
  hours: '2.5–3 h',
  note: 'A short, high-value day: sleep at 3,700 m (+470 m).',
  steps: ['Leave after sunrise warms the avalanche zone only if conditions are stable; ask the lodge.', 'Arrive at MBC by midday, rest and hydrate.'],
  tips: ['Spend the afternoon resting; a short walk up the trail and back is fine.'],
  alerts: ['Avalanche zone between Deurali and MBC: check with lodge owners after recent snow or rain.'],
})
const S_ABC_SAFER = T({
  id: 'abc',
  title: 'MBC → Annapurna Base Camp',
  from: 'mbc',
  to: 'abc',
  km: 4,
  hours: '2–2.5 h',
  note: 'Gentle 430 m gain to ABC (4,130 m), arriving with the whole afternoon to enjoy the sanctuary.',
  steps: ['Walk up to ABC and take the afternoon for views and photos.', 'Early night: sunrise on Annapurna I is the next morning.'],
  tips: ['Stay hydrated and keep moving slowly; no rushing.'],
  alerts: ['Do not continue up with AMS symptoms; rest or descend.'],
})
const S_BAMBOO_DIRECT = T({
  id: 'bamboo',
  title: 'ABC → Bamboo',
  from: 'abc',
  to: 'bamboo',
  km: 17,
  hours: '6–7 h',
  note: 'Sunrise on Annapurna I, then a long descent of ~1,800 m.',
  steps: ['Catch sunrise, eat a big breakfast, then descend past MBC, Deurali and Dovan.', 'Sleep at Bamboo (2,310 m).'],
  tips: ['Use poles on the way down to spare your knees.', 'Leave by 08:30 so you are not walking in the dark.'],
  alerts: [],
})
const S_BAMBOO_SAFER = T({ ...S_BAMBOO_DIRECT, id: 'bamboo' })
const S_POKHARA = T({
  id: 'pokhara',
  title: 'Bamboo → Jhinu Danda → Pokhara',
  from: 'bamboo',
  to: 'pkr',
  km: 10,
  hours: '4–5 h + ~2.5 h jeep',
  note: 'One last climb to Chhomrong, down to Jhinu for the hot springs, then the jeep to Pokhara.',
  steps: ['Climb the steps back up to Chhomrong, then descend to Jhinu Danda.', 'Soak in the natural hot springs, then take the afternoon jeep to Pokhara.'],
  tips: ['Book your Pokhara hotel in advance and ask for a late checkout.', 'Do not rush the hot springs; the jeep station is nearby.'],
  alerts: ['Jeeps thin out in the late afternoon: do not leave Jhinu too late.'],
})

export const VARIANTS: Record<VariantId, { label: string; blurb: string; stages: Stage[] }> = {
  direct: {
    label: 'Direct (6 trek days)',
    blurb: 'Your planned route. Fast and efficient, but the ABC night is a ~900 m jump in sleeping altitude.',
    stages: [S_CHHOMRONG, S_DOVAN, S_DEURALI, S_ABC_DIRECT, S_BAMBOO_DIRECT, S_POKHARA],
  },
  safer: {
    label: 'Safer pace (7 trek days)',
    blurb: 'Sleeps at MBC first, so no night climbs more than ~470 m. Costs one extra day.',
    stages: [S_CHHOMRONG, S_DOVAN, S_DEURALI, S_MBC, S_ABC_SAFER, S_BAMBOO_SAFER, S_POKHARA],
  },
}

/** Things I could not confirm from an official source. Shown prominently in the app. */
export interface Fact {
  id: string
  topic: string
  claim: string
  confidence: 'confirmed' | 'conflicting' | 'estimate'
  action: string
  links?: { label: string; url: string }[]
}

export const FACTS: Fact[] = [
  {
    id: 'guide',
    topic: 'Do you need a guide?',
    claim: 'Sources disagree. Some say foreign trekkers need a licensed guide on Annapurna routes since 2023; others say the Annapurna Conservation Area was excluded or the rule was relaxed in 2026. Several note that it applies to foreign nationals, and that Indians are treated differently.',
    confidence: 'conflicting',
    action: 'Ask at the ACAP / TAAN counter in Pokhara and at the first checkpoint. Keep the answer (and the officer\'s name) in Notes.',
    links: [
      { label: 'Nepal Tourism Board', url: 'https://www.welcomenepal.com' },
      { label: 'Trek Annapurna without a guide in 2026 (Shikhar Adventure)', url: 'https://shikharadventure.com/blog/trek-annapurna-without-guide' },
    ],
  },
  {
    id: 'tims',
    topic: 'Is a TIMS card still needed?',
    claim: 'One 2026 guide says the independent TIMS card was abolished in 2023 and only ACAP is checked; others still list TIMS (about NPR 1,000-2,000 for foreigners).',
    confidence: 'conflicting',
    action: 'Buy the ACAP permit regardless. Ask the counter whether TIMS is required for Indian citizens before paying for it.',
    links: [{ label: 'ACAP & TIMS 2026 (Shikhar Adventure)', url: 'https://shikharadventure.com/blog/acap-tims-permit-nepal-2026' }],
  },
  {
    id: 'acap',
    topic: 'ACAP permit fee for Indians',
    claim: 'Most sources: NPR 1,000 for SAARC nationals (NPR 3,000 for other foreigners). One outlier lists NPR 200.',
    confidence: 'estimate',
    action: 'Carry NPR 3,000 and 4 passport photos to be safe; you will pay the right rate at the counter.',
  },
  {
    id: 'cash',
    topic: 'Indian currency notes',
    claim: 'As of Dec 2025, Nepal Rastra Bank allows Indian ₹200 and ₹500 notes issued on or after 9 Nov 2016, up to ₹25,000 per person. ₹100 and below is always fine; ₹2,000 notes are not covered; older ₹500/₹1,000 notes are prohibited.',
    confidence: 'confirmed',
    action: 'Carry ₹100/₹200/₹500 notes in good condition (new series). Take NPR out of an ATM in Kathmandu/Pokhara for the trail: there are no ATMs above Pokhara.',
    links: [{ label: 'Ekantipur report (Dec 2025)', url: 'https://ekantipur.com/business/2025/12/05/en/india-allows-nepal-to-use-indian-rupee-notes-of-denominations-higher-than-100-48-19.html' }],
  },
  {
    id: 'id',
    topic: 'ID for flying in from India',
    claim: 'Your notes say a passport or voter ID works and Aadhaar alone does not.',
    confidence: 'estimate',
    action: 'Carry your passport (best option) and keep a photocopy and a phone photo separately.',
  },
  {
    id: 'transport',
    topic: 'Kathmandu → Pokhara options',
    claim: 'Tourist bus roughly 6–8 h (NPR ~1,000–2,500 depending on class, usually leaving ~07:00); flight about 25–30 min (~US$40–160 depending on source).',
    confidence: 'estimate',
    action: 'Book the bus at your hotel or an agency a day ahead; for the flight, book as early as possible. Flights can be cancelled by weather.',
  },
  {
    id: 'costs',
    topic: 'Daily costs on the trail',
    claim: 'Independent trekkers report ~US$20–35/day for food and US$5–15/night for a room, rising with altitude. Meal prices are fixed per village by the local committee.',
    confidence: 'estimate',
    action: 'The Money tab uses editable estimates; replace them with real numbers after day 1.',
  },
  {
    id: 'weather',
    topic: 'November conditions',
    claim: 'Autumn is the best season: clear skies, cold nights. Reports put nights near 0 to -5 °C or colder at ABC and 5-10 °C at lower villages.',
    confidence: 'estimate',
    action: 'Plan for sub-zero nights at MBC/ABC. The Plan tab loads a live forecast per stop when you have signal.',
  },
]

export const EMERGENCY = [
  { label: 'Nepal Police', number: '100' },
  { label: 'Ambulance', number: '102' },
  { label: 'Tourist Police (Nepal Tourism Police)', number: '1144' },
]
