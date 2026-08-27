// ALT-STAGE2-PART2/3: IndexedDB implementation of StorageProvider. This is
// the browser-based backend that makes persistence real *today*, without
// requiring Electron to exist first -- the app stays runnable via
// `npm run dev` / StackBlitz throughout the Electron transition, per the
// brief's "must remain runnable during development" requirement.
//
// A future SQLiteStorageProvider (inside electron/storage) will implement
// this exact same interface once the Electron shell exists -- repository
// code in src/repositories/ will not need to change at all when that
// swap happens.

import { StorageProvider, SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION } from './StorageProvider'

const DB_NAME = 'altarview'
const DB_VERSION = 1
const META_STORE = '_meta'

// ALT-STAGE2-PART3: every collection a repository might ask for must be
// declared here as an IndexedDB object store up front -- IndexedDB can
// only create object stores inside an `onupgradeneeded` handler, not
// on-demand. Adding a new repository/collection later means bumping
// DB_VERSION and adding its name here -- that bump IS the migration.
const COLLECTIONS = [
  'songs',
  'themes',
  'sessions',
  'pinned',
  'bibleChapters',
  'bibleVerses',
  'sermonDecks',
] as const

export class IndexedDBStorageProvider implements StorageProvider {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  init(): Promise<void> {
    // Idempotent -- safe to call from multiple repositories/screens
    // without opening the database more than once.
    if (this.initPromise) return this.initPromise
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' })
        }
        for (const name of COLLECTIONS) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' })
          }
        }
      }

      request.onsuccess = async () => {
        this.db = request.result
        // ALT-STAGE2-PART3: record the schema version actually on disk,
        // now that init (including any upgrade) has completed.
        await this.setMeta(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION))
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
    return this.initPromise
  }

  private store(collection: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('IndexedDBStorageProvider.init() must resolve before use')
    return this.db.transaction(collection, mode).objectStore(collection)
  }

  getAll<T>(collection: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const req = this.store(collection, 'readonly').getAll()
      req.onsuccess = () => resolve(req.result as T[])
      req.onerror = () => reject(req.error)
    })
  }

  get<T>(collection: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const req = this.store(collection, 'readonly').get(id)
      req.onsuccess = () => resolve((req.result as T) ?? null)
      req.onerror = () => reject(req.error)
    })
  }

  put<T extends { id: string }>(collection: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.store(collection, 'readwrite').put(item)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  putAll<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(collection, 'readwrite')
      const os = tx.objectStore(collection)
      for (const item of items) os.put(item)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  remove(collection: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.store(collection, 'readwrite').delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  clear(collection: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.store(collection, 'readwrite').clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  getMeta(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const req = this.store(META_STORE, 'readonly').get(key)
      req.onsuccess = () => resolve(req.result ? (req.result as { key: string; value: string }).value : null)
      req.onerror = () => reject(req.error)
    })
  }

  setMeta(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.store(META_STORE, 'readwrite').put({ key, value })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }
}
