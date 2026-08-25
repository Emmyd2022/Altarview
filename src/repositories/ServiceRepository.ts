import type { StorageProvider } from '../core/StorageProvider'
import type { ServiceSession } from '../sessionModel'

const COLLECTION = 'sessions'

// ALT-STAGE2-PART5: this repository persists the SERVICE/SESSION list
// (name + duration, the Playlist's sessions) -- not the runtime timer
// state (current index, remaining seconds, running/paused), which stays
// as ephemeral React state per Part 6's persistent-vs-runtime split.
export class ServiceRepository {
  constructor(private storage: StorageProvider) {}

  getAll(): Promise<ServiceSession[]> {
    return this.storage.getAll<ServiceSession>(COLLECTION)
  }

  saveAll(sessions: ServiceSession[]): Promise<void> {
    // Sessions are edited as a whole ordered list (drag-to-reorder), so
    // callers replace the full set on every change rather than diffing.
    return this.storage.putAll(COLLECTION, sessions)
  }

  replaceAll(sessions: ServiceSession[]): Promise<void> {
    return this.storage.clear(COLLECTION).then(() => this.saveAll(sessions))
  }
}
