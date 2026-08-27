// ALT-STAGE4-PART31/32: a proper, validated import pipeline:
//   File -> Parser -> Validation -> Metadata extraction -> Installation
//
// This is a NEW, additive pipeline alongside the existing
// bibleImport.ts (which still works and is left unchanged, still used
// by SettingsScreen's current "Import Bible Translation" card). The
// difference: bibleImport.ts commits each chapter to bibleModel.ts AS
// IT PARSES, so a malformed file partway through can leave a partial
// import committed. This pipeline stages everything first, validates
// the whole staged set, and only commits if validation passes -- per
// Section 32's explicit "do not allow malformed translation files to
// partially corrupt the installed library."

import { getBook, findBookIdByName } from '../data/canon'
import { scriptureRepository } from '../repository/ScriptureRepository'

export interface StagedChapter {
  bookId: string
  bookNameRaw: string // as it appeared in the source file, for error messages
  chapter: number
  translation: string
  verses: string[] // index 0 = verse 1
}

export interface ImportValidationError {
  bookNameRaw: string
  chapter?: number
  message: string
}

export interface ImportValidationResult {
  valid: boolean
  errors: ImportValidationError[]
  staged: StagedChapter[]
  translationName: string
  summary: { chapters: number; verses: number; books: number }
}

// ---- Stage 1: parse into a staging structure (no commit) ----

export function stageZefaniaXML(xmlText: string, translationName: string): { staged: StagedChapter[]; errors: ImportValidationError[] } {
  const errors: ImportValidationError[] = []
  const staged: StagedChapter[] = []

  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  } catch {
    return { staged, errors: [{ bookNameRaw: '', message: 'Could not parse XML file.' }] }
  }
  if (doc.querySelector('parsererror')) {
    return { staged, errors: [{ bookNameRaw: '', message: 'XML file is not well-formed.' }] }
  }
  const books = doc.querySelectorAll('BIBLEBOOK')
  if (books.length === 0) {
    return { staged, errors: [{ bookNameRaw: '', message: 'No <BIBLEBOOK> elements found -- is this a Zefania-format file?' }] }
  }

  books.forEach((bookEl) => {
    const bookNameRaw = bookEl.getAttribute('bname') || bookEl.getAttribute('bsname') || 'Unknown'
    const bookId = findBookIdByName(bookNameRaw)
    if (!bookId) {
      errors.push({ bookNameRaw, message: `"${bookNameRaw}" is not a recognized Bible book name.` })
      return
    }
    bookEl.querySelectorAll('CHAPTER').forEach((chapterEl) => {
      const chapterNum = parseInt(chapterEl.getAttribute('cnumber') || '0', 10)
      if (!chapterNum) {
        errors.push({ bookNameRaw, message: 'A chapter is missing a valid cnumber.' })
        return
      }
      const verses: string[] = []
      const seenVerseNumbers = new Set<number>()
      chapterEl.querySelectorAll('VERS').forEach((v) => {
        const vNum = parseInt(v.getAttribute('vnumber') || '0', 10)
        const text = (v.textContent || '').trim()
        if (!vNum || !text) return
        if (seenVerseNumbers.has(vNum)) {
          errors.push({ bookNameRaw, chapter: chapterNum, message: `Duplicate verse ${vNum}.` })
          return
        }
        seenVerseNumbers.add(vNum)
        verses[vNum - 1] = text
      })
      if (verses.length > 0) {
        for (let i = 0; i < verses.length; i++) if (verses[i] === undefined) verses[i] = ''
        staged.push({ bookId, bookNameRaw, chapter: chapterNum, translation: translationName, verses })
      }
    })
  })

  return { staged, errors }
}

interface SimpleJSONFormat {
  translation: string
  books: Record<string, Record<string, string[]>>
}

export function stageSimpleJSON(jsonText: string): { staged: StagedChapter[]; errors: ImportValidationError[]; translationName: string } {
  let data: SimpleJSONFormat
  try {
    data = JSON.parse(jsonText)
  } catch {
    return { staged: [], errors: [{ bookNameRaw: '', message: 'Could not parse JSON file -- check it is valid JSON.' }], translationName: '' }
  }
  if (!data.translation || !data.books) {
    return { staged: [], errors: [{ bookNameRaw: '', message: 'JSON must have a "translation" name and a "books" object.' }], translationName: data.translation || '' }
  }

  const errors: ImportValidationError[] = []
  const staged: StagedChapter[] = []

  for (const [bookNameRaw, chapters] of Object.entries(data.books)) {
    const bookId = findBookIdByName(bookNameRaw)
    if (!bookId) {
      errors.push({ bookNameRaw, message: `"${bookNameRaw}" is not a recognized Bible book name.` })
      continue
    }
    for (const [chapterStr, verses] of Object.entries(chapters)) {
      const chapterNum = parseInt(chapterStr, 10)
      if (!chapterNum || !Array.isArray(verses)) {
        errors.push({ bookNameRaw, message: `Chapter "${chapterStr}" is invalid (must be a numbered chapter with an array of verse strings).` })
        continue
      }
      staged.push({ bookId, bookNameRaw, chapter: chapterNum, translation: data.translation, verses })
    }
  }

  return { staged, errors, translationName: data.translation }
}

// ---- Stage 2: validate the staged data against the canon ----

export function validateStaged(staged: StagedChapter[], translationName: string): ImportValidationResult {
  const errors: ImportValidationError[] = []
  const seenChapterKeys = new Set<string>()

  for (const chapter of staged) {
    const book = getBook(chapter.bookId)
    if (!book) {
      errors.push({ bookNameRaw: chapter.bookNameRaw, chapter: chapter.chapter, message: `Unknown book id "${chapter.bookId}".` })
      continue
    }
    if (book.expectedChapters && chapter.chapter > book.expectedChapters) {
      errors.push({ bookNameRaw: chapter.bookNameRaw, chapter: chapter.chapter, message: `${book.name} only has ${book.expectedChapters} chapters, but chapter ${chapter.chapter} was supplied.` })
    }
    const key = `${chapter.bookId}|${chapter.chapter}`
    if (seenChapterKeys.has(key)) {
      errors.push({ bookNameRaw: chapter.bookNameRaw, chapter: chapter.chapter, message: `${book.name} ${chapter.chapter} appears more than once in this file.` })
    }
    seenChapterKeys.add(key)
    if (chapter.verses.length === 0) {
      errors.push({ bookNameRaw: chapter.bookNameRaw, chapter: chapter.chapter, message: `${book.name} ${chapter.chapter} has no verses.` })
    }
  }

  const bookIds = new Set(staged.map((c) => c.bookId))
  const verseCount = staged.reduce((sum, c) => sum + c.verses.filter(Boolean).length, 0)

  return {
    valid: errors.length === 0 && staged.length > 0,
    errors,
    staged,
    translationName,
    summary: { chapters: staged.length, verses: verseCount, books: bookIds.size },
  }
}

// ---- Stage 3: commit (only call this after validation passes) ----

export function commitStaged(result: ImportValidationResult): void {
  if (!result.valid) {
    throw new Error('Refusing to commit an import that failed validation -- call validateStaged() first and check .valid.')
  }
  for (const chapter of result.staged) {
    const book = getBook(chapter.bookId)
    if (!book) continue // already reported by validation; defensive skip
    scriptureRepository.addChapter(book.name, chapter.chapter, chapter.translation, chapter.verses)
  }
}

// ---- Convenience: full pipeline in one call ----

export function importZefaniaXMLValidated(xmlText: string, translationName: string): ImportValidationResult {
  const { staged, errors: stageErrors } = stageZefaniaXML(xmlText, translationName)
  const result = validateStaged(staged, translationName)
  result.errors = [...stageErrors, ...result.errors]
  result.valid = result.valid && stageErrors.length === 0
  if (result.valid) commitStaged(result)
  return result
}

export function importSimpleJSONValidated(jsonText: string): ImportValidationResult {
  const { staged, errors: stageErrors, translationName } = stageSimpleJSON(jsonText)
  const result = validateStaged(staged, translationName)
  result.errors = [...stageErrors, ...result.errors]
  result.valid = result.valid && stageErrors.length === 0
  if (result.valid) commitStaged(result)
  return result
}
