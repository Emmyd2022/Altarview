// ALT-STAGE4-PART29: pinned scripture items must be identified by a
// stable PassageReference, never by rendered text alone -- this is what
// lets a pin still resolve correctly even if, say, the operator later
// switches which translation is active. Resolution happens here, at
// open-time, against whatever the Scripture Engine currently has
// installed.

import { scriptureEngine } from '../services/ScriptureEngine'
import type { Passage, PassageReference } from '../types'

export interface ScripturePinResolution {
  ok: boolean
  passage?: Passage
  error?: string
}

export function resolveScripturePin(reference: PassageReference): ScripturePinResolution {
  const translation = scriptureEngine.getTranslation(reference.translationId)
  if (!translation) {
    return { ok: false, error: `Unknown translation "${reference.translationId}".` }
  }
  if (!translation.installed) {
    return { ok: false, error: `${translation.name} is not currently installed -- import it again from the Translation Library to use this pin.` }
  }
  const book = scriptureEngine.getBook(reference.bookId)
  if (!book) {
    return { ok: false, error: `Unknown book "${reference.bookId}".` }
  }
  const passage = scriptureEngine.getPassage(reference)
  if (!passage) {
    return { ok: false, error: `${book.name} ${reference.startChapter}:${reference.startVerse} is not available in ${translation.abbreviation}.` }
  }
  return { ok: true, passage }
}
