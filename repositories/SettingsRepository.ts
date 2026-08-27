import type { StorageProvider } from '../core/StorageProvider'

const SETTINGS_META_KEY = 'app_settings'

// ALT-STAGE2-PART4/6: settings are a single small object, not a list of
// entities -- stored via the meta key/value area rather than a
// collection. Kept intentionally loose (Record<string, unknown>) at this
// stage since Stage 2 is not redesigning Settings; this just gives it a
// real place to persist to.
export type AppSettings = Record<string, unknown>

export class SettingsRepository {
  constructor(private storage: StorageProvider) {}

  async get(): Promise<AppSettings> {
    const raw = await this.storage.getMeta(SETTINGS_META_KEY)
    return raw ? JSON.parse(raw) : {}
  }

  async save(settings: AppSettings): Promise<void> {
    await this.storage.setMeta(SETTINGS_META_KEY, JSON.stringify(settings))
  }

  async update(patch: AppSettings): Promise<AppSettings> {
    const current = await this.get()
    const next = { ...current, ...patch }
    await this.save(next)
    return next
  }
}
