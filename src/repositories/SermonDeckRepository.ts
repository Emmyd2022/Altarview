import type { StorageProvider } from '../core/StorageProvider'

const COLLECTION = 'sermonDecks'

// ALT-STAGE2-PART5: "Saved Decks" previously lived only as local state
// inside SermonSlidesScreen.tsx -- meaningful application data trapped in
// a UI component, per the Stage 1 finding. This gives it a real,
// independent model + repository.
export interface SermonSlide {
  id: number
  text: string
}

export interface SermonDeck {
  id: string
  name: string
  slides: SermonSlide[]
}

export class SermonDeckRepository {
  constructor(private storage: StorageProvider) {}

  getAll(): Promise<SermonDeck[]> {
    return this.storage.getAll<SermonDeck>(COLLECTION)
  }

  save(deck: SermonDeck): Promise<void> {
    return this.storage.put(COLLECTION, deck)
  }

  delete(id: string): Promise<void> {
    return this.storage.remove(COLLECTION, id)
  }
}
