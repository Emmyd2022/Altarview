import type { StorageProvider } from '../core/StorageProvider'
import type { ThemeDef } from '../themeModel'

const COLLECTION = 'themes'
const ACTIVE_THEME_META_KEY = 'active_theme_id'

export class ThemeRepository {
  constructor(private storage: StorageProvider) {}

  getAll(): Promise<ThemeDef[]> {
    return this.storage.getAll<ThemeDef>(COLLECTION)
  }

  save(theme: ThemeDef): Promise<void> {
    return this.storage.put(COLLECTION, theme)
  }

  saveAll(themes: ThemeDef[]): Promise<void> {
    return this.storage.putAll(COLLECTION, themes)
  }

  delete(id: string): Promise<void> {
    return this.storage.remove(COLLECTION, id)
  }

  getActiveThemeId(): Promise<string | null> {
    return this.storage.getMeta(ACTIVE_THEME_META_KEY)
  }

  setActiveThemeId(id: string): Promise<void> {
    return this.storage.setMeta(ACTIVE_THEME_META_KEY, id)
  }
}
