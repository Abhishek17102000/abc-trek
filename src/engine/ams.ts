// Acute mountain sickness self-check, based on the Lake Louise score (2018 revision).
// Informational only: it is not a diagnosis. When unsure, do not go higher.

export type Sev = 0 | 1 | 2 | 3

export interface Symptoms {
  headache: Sev
  gi: Sev
  fatigue: Sev
  dizziness: Sev
}

export interface RedFlags {
  /** Cannot walk a straight line heel-to-toe / clumsy. */
  ataxia: boolean
  confusion: boolean
  breathlessAtRest: boolean
  /** Persistent wet cough, pink or frothy sputum, chest gurgling. */
  wetCough: boolean
}

export type Level = 'none' | 'mild' | 'moderate' | 'severe' | 'emergency'

export interface Assessment {
  score: number
  level: Level
  title: string
  actions: string[]
  allowAscend: boolean
  suggestRest: boolean
  mustDescend: boolean
}

export const NO_FLAGS: RedFlags = { ataxia: false, confusion: false, breathlessAtRest: false, wetCough: false }

export const score = (s: Symptoms) => s.headache + s.gi + s.fatigue + s.dizziness

export function assess(s: Symptoms, flags: RedFlags = NO_FLAGS, spo2?: number, altitude = 0): Assessment {
  const total = score(s)
  const flagged = flags.ataxia || flags.confusion || flags.breathlessAtRest || flags.wetCough
  const hasAms = s.headache >= 1 && total >= 3

  if (flagged || (hasAms && total >= 10)) {
    return {
      score: total,
      level: 'emergency',
      title: 'Emergency signs: descend now',
      actions: [
        'Start descending immediately with someone; do not stay up and "see how it goes".',
        'Do not go alone, and do not delay for the morning if it is night and you can descend safely with a headlamp and company.',
        'Call your insurer\'s emergency helpline for helicopter evacuation; ask the lodge owner to help and to phone a rescue.',
        'These can be signs of cerebral or pulmonary oedema, which can be fatal.',
      ],
      allowAscend: false,
      suggestRest: false,
      mustDescend: true,
    }
  }
  if (hasAms && total >= 6) {
    return {
      score: total,
      level: 'moderate',
      title: 'Moderate AMS: go down',
      actions: [
        'Do not go higher. Descend at least 300–500 m (to a lower village) and stay with a partner or the lodge.',
        'Rest, drink fluids, and ask a medic or your insurer helpline about medication.',
        'If symptoms worsen or any red-flag appears, arrange emergency descent or evacuation.',
      ],
      allowAscend: false,
      suggestRest: false,
      mustDescend: true,
    }
  }
  if (hasAms) {
    return {
      score: total,
      level: 'mild',
      title: 'Mild AMS: do not go higher today',
      actions: [
        'Stay at this altitude (or go slightly lower) and take a rest day.',
        'Drink regularly, eat, avoid alcohol and sleeping pills, and keep warm.',
        'Re-check in a few hours. If not improving by tomorrow, or if it gets worse, descend.',
      ],
      allowAscend: false,
      suggestRest: true,
      mustDescend: false,
    }
  }
  const extra: string[] = []
  if (spo2 !== undefined && altitude >= 3000 && spo2 < 75) {
    extra.push('Your SpO₂ reading is low even for altitude. Warm your hands, re-measure after 5 minutes of rest; if it stays low or you feel unwell, do not ascend.')
  }
  return {
    score: total,
    level: 'none',
    title: total > 0 ? 'Symptoms are minor' : 'No AMS signs',
    actions: [
      'Continue as planned, but keep the golden rules: climb slowly, drink 3–4 L, and sleep no more than ~500 m higher than the night before above 3,000 m.',
      'Any new headache that is more than mild changes the plan. Tell your partner or the lodge.',
      ...extra,
    ],
    allowAscend: true,
    suggestRest: false,
    mustDescend: false,
  }
}

export const LEVEL_TONE: Record<Level, 'good' | 'warn' | 'bad'> = { none: 'good', mild: 'warn', moderate: 'bad', severe: 'bad', emergency: 'bad' }
