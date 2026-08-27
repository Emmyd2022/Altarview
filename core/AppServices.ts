// ALT-STAGE2-PART1/2: composition root. This is the single place in the
// whole app that knows which StorageProvider implementation is active.
// Every screen/component gets its repositories from here, never
// constructs a StorageProvider directly. When the Electron+SQLite
// backend exists, only this file changes (to pick SQLiteStorageProvider
// when running inside Electron) -- no repository or screen code changes.

import { IndexedDBStorageProvider } from './IndexedDBStorageProvider'
import type { StorageProvider } from './StorageProvider'
import { SongRepository } from '../repositories/SongRepository'
import { ThemeRepository } from '../repositories/ThemeRepository'
import { ServiceRepository } from '../repositories/ServiceRepository'
import { PinnedRepository } from '../repositories/PinnedRepository'
import { BibleRepository } from '../repositories/BibleRepository'
import { SettingsRepository } from '../repositories/SettingsRepository'
import { SermonDeckRepository } from '../repositories/SermonDeckRepository'

export interface AppServices {
  storage: StorageProvider
  songRepo: SongRepository
  themeRepo: ThemeRepository
  serviceRepo: ServiceRepository
  pinnedRepo: PinnedRepository
  bibleRepo: BibleRepository
  settingsRepo: SettingsRepository
  sermonDeckRepo: SermonDeckRepository
}

let servicesPromise: Promise<AppServices> | null = null

// ALT-STAGE2-PART1: this is the seam. Today it always picks IndexedDB.
// Once electron/storage/SQLiteStorageProvider exists, this becomes:
//   const storage = isElectron() ? new SQLiteStorageProvider() : new IndexedDBStorageProvider()
// and nothing else in src/ needs to change.
function createStorageProvider(): StorageProvider {
  return new IndexedDBStorageProvider()
}

export function getAppServices(): Promise<AppServices> {
  if (!servicesPromise) {
    servicesPromise = (async () => {
      const storage = createStorageProvider()
      await storage.init()
      return {
        storage,
        songRepo: new SongRepository(storage),
        themeRepo: new ThemeRepository(storage),
        serviceRepo: new ServiceRepository(storage),
        pinnedRepo: new PinnedRepository(storage),
        bibleRepo: new BibleRepository(storage),
        settingsRepo: new SettingsRepository(storage),
        sermonDeckRepo: new SermonDeckRepository(storage),
      }
    })()
  }
  return servicesPromise
}
