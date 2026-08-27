import type { StorageProvider } from '../core/StorageProvider'

const CHAPTERS_COLLECTION = 'bibleChapters'
const VERSES_COLLECTION = 'bibleVerses'

// ALT-STAGE2-PART5: mirrors the shapes bibleModel.ts already works with
// internally, just with the `id` field StorageProvider requires. This
// repository does NOT replace bibleModel.ts's in-memory Map (which stays
// as the fast, synchronous lookup structure every screen already calls
// into) -- it persists what's IMPORTED so it can be reloaded into that
// Map on startup, and reads back out to repopulate it after a reload.
export interface StoredChapter {
  id: string // `${book}|${chapter}|${translation}`
  book: string
  chapter: number
  translation: string
  verses: string[]
}

export interface StoredVerse {
  id: string // `${book}|${chapter}|${verse}|${translation}`
  book: string
  chapter: number
  verse: number
  translation: string
  text: string
}

export class BibleRepository {
  constructor(private storage: StorageProvider) {}

  getAllChapters(): Promise<StoredChapter[]> {
    return this.storage.getAll<StoredChapter>(CHAPTERS_COLLECTION)
  }

  saveChapter(chapter: StoredChapter): Promise<void> {
    return this.storage.put(CHAPTERS_COLLECTION, chapter)
  }

  getAllVerses(): Promise<StoredVerse[]> {
    return this.storage.getAll<StoredVerse>(VERSES_COLLECTION)
  }

  saveVerses(verses: StoredVerse[]): Promise<void> {
    return this.storage.putAll(VERSES_COLLECTION, verses)
  }
}
