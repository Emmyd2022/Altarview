import { describe, it, expect } from 'vitest'
import { stageZefaniaXML, stageSimpleJSON, validateStaged, commitStaged, importZefaniaXMLValidated, importSimpleJSONValidated } from './scriptureImport'
import { scriptureRepository } from '../repository/ScriptureRepository'

// ALT-STAGE4-PART47: fixture files, inline (not depending on real KJV or
// any copyrighted text) -- short, synthetic, valid and invalid samples
// of each supported import format.

const VALID_ZEFANIA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<XMLBIBLE>
  <BIBLEBOOK bnumber="43" bname="John">
    <CHAPTER cnumber="15">
      <VERS vnumber="1">Synthetic test verse one.</VERS>
      <VERS vnumber="2">Synthetic test verse two.</VERS>
    </CHAPTER>
  </BIBLEBOOK>
</XMLBIBLE>`

const INVALID_BOOK_ZEFANIA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<XMLBIBLE>
  <BIBLEBOOK bnumber="999" bname="NotARealBook">
    <CHAPTER cnumber="1">
      <VERS vnumber="1">Some text.</VERS>
    </CHAPTER>
  </BIBLEBOOK>
</XMLBIBLE>`

const MALFORMED_XML = `<XMLBIBLE><BIBLEBOOK bname="John"><CHAPTER cnumber="1">`  // unclosed tags

const NOT_ZEFANIA_XML = `<?xml version="1.0"?><root><item>hello</item></root>`

const VALID_JSON = JSON.stringify({
  translation: 'TESTJSON',
  books: { John: { '17': ['Synthetic json verse one.', 'Synthetic json verse two.'] } },
})

const INVALID_BOOK_JSON = JSON.stringify({
  translation: 'TESTJSON2',
  books: { NotARealBook: { '1': ['text'] } },
})

const MALFORMED_JSON = `{ "translation": "X", "books": { `  // truncated

const MISSING_FIELDS_JSON = JSON.stringify({ books: { John: { '1': ['text'] } } }) // no "translation"

describe('Import validation pipeline', () => {
  describe('Zefania XML', () => {
    it('stages a valid file with no errors and validates successfully', () => {
      const { staged, errors } = stageZefaniaXML(VALID_ZEFANIA_XML, 'TESTZEF')
      expect(errors).toEqual([])
      expect(staged.length).toBe(1)
      const result = validateStaged(staged, 'TESTZEF')
      expect(result.valid).toBe(true)
      expect(result.summary).toEqual({ chapters: 1, verses: 2, books: 1 })
    })

    it('rejects an unrecognized book name', () => {
      const { staged, errors: stageErrors } = stageZefaniaXML(INVALID_BOOK_ZEFANIA_XML, 'TESTZEF')
      expect(stageErrors.length).toBeGreaterThan(0)
      expect(stageErrors[0].message).toMatch(/not a recognized Bible book/)
      expect(staged.length).toBe(0)
    })

    it('rejects malformed XML', () => {
      const { errors } = stageZefaniaXML(MALFORMED_XML, 'TESTZEF')
      expect(errors.length).toBeGreaterThan(0)
    })

    it('rejects XML that is well-formed but not Zefania-structured', () => {
      const { errors } = stageZefaniaXML(NOT_ZEFANIA_XML, 'TESTZEF')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toMatch(/BIBLEBOOK/)
    })

    it('the full validated pipeline commits a valid file and makes it queryable', () => {
      const result = importZefaniaXMLValidated(VALID_ZEFANIA_XML, 'TESTZEFCOMMIT')
      expect(result.valid).toBe(true)
      const verse = scriptureRepository.getVerse('testzefcommit', 'john', 15, 1)
      expect(verse?.text).toBe('Synthetic test verse one.')
    })

    it('the full validated pipeline refuses to commit an invalid file', () => {
      const result = importZefaniaXMLValidated(INVALID_BOOK_ZEFANIA_XML, 'TESTZEFBAD')
      expect(result.valid).toBe(false)
      // Nothing should have been committed -- querying for it finds nothing.
      const books = scriptureRepository.getBooks()
      expect(books.find((b) => b.name === 'NotARealBook')).toBeUndefined()
    })
  })

  describe('Simple JSON', () => {
    it('stages and validates a valid file', () => {
      const { staged, errors, translationName } = stageSimpleJSON(VALID_JSON)
      expect(errors).toEqual([])
      expect(translationName).toBe('TESTJSON')
      const result = validateStaged(staged, translationName)
      expect(result.valid).toBe(true)
    })

    it('rejects an unrecognized book name', () => {
      const { errors } = stageSimpleJSON(INVALID_BOOK_JSON)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toMatch(/not a recognized Bible book/)
    })

    it('rejects malformed JSON', () => {
      const { errors } = stageSimpleJSON(MALFORMED_JSON)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('rejects JSON missing required top-level fields', () => {
      const { errors } = stageSimpleJSON(MISSING_FIELDS_JSON)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toMatch(/translation/)
    })

    it('the full validated pipeline commits a valid file', () => {
      const result = importSimpleJSONValidated(VALID_JSON)
      expect(result.valid).toBe(true)
      const verse = scriptureRepository.getVerse('testjson', 'john', 17, 1)
      expect(verse?.text).toBe('Synthetic json verse one.')
    })
  })

  describe('Duplicate detection', () => {
    it('flags a chapter that appears twice in the staged data', () => {
      const staged = [
        { bookId: 'john', bookNameRaw: 'John', chapter: 97, translation: 'TESTDUP', verses: ['a'] },
        { bookId: 'john', bookNameRaw: 'John', chapter: 97, translation: 'TESTDUP', verses: ['b'] },
      ]
      const result = validateStaged(staged, 'TESTDUP')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.match(/more than once/))).toBe(true)
    })
  })

  describe('commitStaged safety', () => {
    it('throws if called with an invalid (unvalidated-as-passing) result rather than silently committing', () => {
      const badResult = validateStaged([{ bookId: 'not-a-book', bookNameRaw: 'X', chapter: 1, translation: 'T', verses: [] }], 'T')
      expect(badResult.valid).toBe(false)
      expect(() => commitStaged(badResult)).toThrow()
    })
  })
})
