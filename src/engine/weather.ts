import { PLACES } from '../data/trek'

export interface Wx {
  date: string
  min: number
  max: number
  rainMm: number
  snowCm: number
  windKmh: number
  code: number
}

const CODE: [number, string, string][] = [
  [0, '☀️', 'Clear'],
  [2, '⛅', 'Partly cloudy'],
  [3, '☁️', 'Overcast'],
  [48, '🌫️', 'Fog'],
  [57, '🌦️', 'Drizzle'],
  [67, '🌧️', 'Rain'],
  [77, '🌨️', 'Snow'],
  [82, '🌧️', 'Showers'],
  [86, '🌨️', 'Snow showers'],
  [99, '⛈️', 'Thunderstorm'],
]

export function describe(code: number): { icon: string; text: string } {
  const hit = CODE.find(([max]) => code <= max) ?? CODE[CODE.length - 1]
  return { icon: hit[1], text: hit[2] }
}

/** Free, key-less forecast (Open-Meteo), corrected to the stop's altitude. Up to 16 days ahead. */
export async function fetchForecast(placeId: string, signal?: AbortSignal): Promise<Wx[]> {
  const p = PLACES[placeId]
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${p.lat}&longitude=${p.lon}&elevation=${p.alt}` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max,weather_code' +
    '&timezone=Asia%2FKathmandu&forecast_days=16'
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`forecast ${res.status}`)
  const j = (await res.json()) as {
    daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; snowfall_sum: number[]; wind_speed_10m_max: number[]; weather_code: number[] }
  }
  const d = j.daily
  return d.time.map((date, i) => ({
    date,
    max: Math.round(d.temperature_2m_max[i]),
    min: Math.round(d.temperature_2m_min[i]),
    rainMm: Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10,
    snowCm: Math.round((d.snowfall_sum[i] ?? 0) * 10) / 10,
    windKmh: Math.round(d.wind_speed_10m_max[i] ?? 0),
    code: d.weather_code[i] ?? 0,
  }))
}

/** Plain-language heads-up for a day's weather. */
export function wxAdvice(w: Wx, alt: number): string | null {
  if (w.snowCm >= 5) return 'Heavy snow forecast: avalanche risk above Deurali. Ask lodges before moving.'
  if (w.rainMm >= 10) return 'Heavy rain forecast: slippery stairs, leeches and landslides on the lower trail.'
  if (w.windKmh >= 40 && alt > 3000) return 'Strong wind forecast at altitude: extra layers.'
  if (w.min <= -8) return 'Very cold night forecast: sleeping bag + all layers.'
  return null
}
