# ABC Trek Companion

An offline-first phone app (PWA) for planning and doing the Annapurna Base Camp trek from Pokhara.

- **Today**: countdown before the trip; during it, today's stage, forecast, and daily check-ins.
- **Daily check-ins**: a morning altitude-sickness self-check (Lake Louise score) and an evening log. Your answers re-plan the remaining days automatically (rest days, delays, sleeping somewhere else).
- **Plan**: direct 6-day vs safer 7-day route, flight-buffer check, sleeping-altitude warnings, acclimatisation days, per-stop forecast (Open-Meteo, cached offline).
- **Money**: editable cost estimate (budget / comfort / luxury), expense log in INR or NPR (fixed 1 INR = 1.6 NPR).
- **Prepare**: dated pre-trip tasks, packing list with a weight meter, rentable gear.
- **Safety**: altitude rules, emergency numbers, an emergency card, and a share-with-family text.
- **Facts to verify**: items where sources disagree (guide rule, TIMS, cash).

All data stays in the browser on the phone (localStorage). Export / import a JSON backup in Settings.

```bash
npm install
npm run dev        # develop
npm test           # unit tests
npm run e2e        # build + end-to-end tests (needs Chrome or Edge)
npm run build      # production build into dist/
```

Not medical advice. Costs and rules are estimates from public sources; verify them locally.
