// ALT-STAGE2-PART2: the persistence abstraction repositories are built
// against. This interface is deliberately storage-agnostic -- it maps
// cleanly onto IndexedDB object stores today (IndexedDBStorageProvider)
// and onto SQLite tables later inside Electron (a future
// SQLiteStorageProvider), without any repository code needing to change
// when that swap happens. "collection" == an IndexedDB object store name
// today, and will == a SQLite table name later.
//
// Every entity stored through this interface must have a string `id`.

export interface StorageProvider {
  /** Opens/creates the underlying store. Must be called once before any
   * other method, and must be safe to call multiple times (idempotent). */
  init(): Promise<void>

  getAll<T>(collection: string): Promise<T[]>
  get<T>(collection: string, id: string): Promise<T | null>
  put<T extends { id: string }>(collection: string, item: T): Promise<void>
  putAll<T extends { id: string }>(collection: string, items: T[]): Promise<void>
  remove(collection: string, id: string): Promise<void>
  clear(collection: string): Promise<void>

  // Small key/value area for things that aren't a list of entities --
  // schema version, single-object settings blobs, etc.
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
}

// ALT-STAGE2-PART3: schema version tracking. Each StorageProvider
// implementation is responsible for calling this during init() (after
// running any needed migrations) so PERSISTED_SCHEMA_VERSION is always an
// accurate record of what shape of data is on disk.
export const SCHEMA_VERSION_KEY = 'altarview_schema_version'
export const CURRENT_SCHEMA_VERSION = 1
