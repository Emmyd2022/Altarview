import type { StorageProvider } from '../core/StorageProvider'
import type { PinnedItem } from '../pinModel'

const COLLECTION = 'pinned'

export class PinnedRepository {
  constructor(private storage: StorageProvider) {}

  getAll(): Promise<PinnedItem[]> {
    return this.storage.getAll<PinnedItem>(COLLECTION)
  }

  save(item: PinnedItem): Promise<void> {
    return this.storage.put(COLLECTION, item)
  }

  saveAll(items: PinnedItem[]): Promise<void> {
    return this.storage.putAll(COLLECTION, items)
  }

  delete(id: string): Promise<void> {
    return this.storage.remove(COLLECTION, id)
  }

  replaceAll(items: PinnedItem[]): Promise<void> {
    return this.storage.clear(COLLECTION).then(() => this.saveAll(items))
  }
}
