// ALT: Bible import parsers -- lets the church load their own properly
// licensed translation files, matching FreeShow's own approach (it never
// bundles copyrighted translations; users import Zefania/OSIS/OpenSong
// XML files, or similar, from sources they're licensed to use).
//
// Two formats are supported here:
// 1. Zefania-style XML: <BIBLEBOOK bname="John"><CHAPTER cnumber="1">
//      <VERS vnumber="1">In the beginning...</VERS></CHAPTER></BIBLEBOOK>
// 2. A simple JSON format we define ourselves, easiest for someone to
//    hand-build a test file with:
//      { "translation": "NIV", "books": { "John": { "1": ["verse 1 text", "verse 2 text"] } } }

import { addImportedChapter, addImportedVerses, type BibleVerse } from './bibleModel'

export interface ImportResult {
  translation: string
  chaptersImported: number
  versesImported: number
  errors: string[]
}

export function importZefaniaXML(xmlText: string, translationName: string): ImportResult {
  const errors: string[] = []
  let chaptersImported = 0
  let versesImported = 0

  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  } catch {
    return { translation: translationName, chaptersImported: 0, versesImported: 0, errors: ['Could not parse XML file.'] }
  }

  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    return { translation: translationName, chaptersImported: 0, versesImported: 0, errors: ['XML file is not well-formed.'] }
  }

  const books = doc.querySelectorAll('BIBLEBOOK')
  if (books.length === 0) {
    return { translation: translationName, chaptersImported: 0, versesImported: 0, errors: ['No <BIBLEBOOK> elements found -- is this a Zefania-format file?'] }
  }

  books.forEach((bookEl) => {
    const bookName = bookEl.getAttribute('bname') || bookEl.getAttribute('bsname') || 'Unknown'
    const chapters = bookEl.querySelectorAll('CHAPTER')
    chapters.forEach((chapterEl) => {
      const chapterNum = parseInt(chapterEl.getAttribute('cnumber') || '0', 10)
      if (!chapterNum) {
        errors.push(`${bookName}: chapter missing a valid cnumber, skipped.`)
        return
      }
      const verseEls = chapterEl.querySelectorAll('VERS')
      const verses: string[] = []
      verseEls.forEach((v) => {
        const vNum = parseInt(v.getAttribute('vnumber') || '0', 10)
        const text = (v.textContent || '').trim()
        if (vNum && text) verses[vNum - 1] = text
      })
      if (verses.length > 0) {
        // Fill any gaps so array indices line up with verse numbers.
        for (let i = 0; i < verses.length; i++) if (verses[i] === undefined) verses[i] = ''
        addImportedChapter(bookName, chapterNum, translationName, verses)
        chaptersImported += 1
        versesImported += verses.filter(Boolean).length
      }
    })
  })

  if (chaptersImported === 0) {
    errors.push('No chapters could be imported -- check the file matches the Zefania XML structure.')
  }

  return { translation: translationName, chaptersImported, versesImported, errors }
}

interface SimpleJSONFormat {
  translation: string
  books: Record<string, Record<string, string[]>>
}

export function importSimpleJSON(jsonText: string): ImportResult {
  let data: SimpleJSONFormat
  try {
    data = JSON.parse(jsonText)
  } catch {
    return { translation: '', chaptersImported: 0, versesImported: 0, errors: ['Could not parse JSON file -- check it is valid JSON.'] }
  }

  if (!data.translation || !data.books) {
    return { translation: data.translation || '', chaptersImported: 0, versesImported: 0, errors: ['JSON must have a "translation" name and a "books" object -- see the format guide.'] }
  }

  const errors: string[] = []
  let chaptersImported = 0
  let versesImported = 0

  for (const [book, chapters] of Object.entries(data.books)) {
    for (const [chapterStr, verses] of Object.entries(chapters)) {
      const chapterNum = parseInt(chapterStr, 10)
      if (!chapterNum || !Array.isArray(verses)) {
        errors.push(`${book} ${chapterStr}: invalid chapter data, skipped.`)
        continue
      }
      addImportedChapter(book, chapterNum, data.translation, verses)
      chaptersImported += 1
      versesImported += verses.filter(Boolean).length
    }
  }

  return { translation: data.translation, chaptersImported, versesImported, errors }
}

// For importing a handful of scattered single verses rather than whole
// chapters (e.g. topical verse packs).
export function importVerseList(verses: BibleVerse[]): ImportResult {
  addImportedVerses(verses)
  const translations = Array.from(new Set(verses.map((v) => v.translation)))
  return {
    translation: translations.join(', '),
    chaptersImported: 0,
    versesImported: verses.length,
    errors: [],
  }
}
