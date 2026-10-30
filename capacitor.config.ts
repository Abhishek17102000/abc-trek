import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.abctrek.companion',
  appName: 'ABC Trek',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: { LocalNotifications: { smallIcon: 'ic_stat_abctrek', iconColor: '#FBBF24' } },
}

export default config
