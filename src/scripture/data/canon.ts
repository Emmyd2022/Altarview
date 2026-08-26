// ALT-STAGE4-PART6: the canonical book registry. One definition per book,
// shared across every translation -- a translation's data only ever
// supplies verse TEXT for a given (bookId, chapter, verse); it never
// redefines what "john" or "genesis" means. This is standard
// bibliographic structure (names/order/abbreviations), not scripture
// text itself.

import type { Book } from '../types'

export const CANON: Book[] = [
  // Old Testament
  { id: 'genesis', name: 'Genesis', abbreviations: ['Gen', 'Ge', 'Gn'], testament: 'OT', order: 1, expectedChapters: 50 },
  { id: 'exodus', name: 'Exodus', abbreviations: ['Exo', 'Ex'], testament: 'OT', order: 2, expectedChapters: 40 },
  { id: 'leviticus', name: 'Leviticus', abbreviations: ['Lev', 'Le', 'Lv'], testament: 'OT', order: 3, expectedChapters: 27 },
  { id: 'numbers', name: 'Numbers', abbreviations: ['Num', 'Nu', 'Nm'], testament: 'OT', order: 4, expectedChapters: 36 },
  { id: 'deuteronomy', name: 'Deuteronomy', abbreviations: ['Deut', 'Dt'], testament: 'OT', order: 5, expectedChapters: 34 },
  { id: 'joshua', name: 'Joshua', abbreviations: ['Josh', 'Jos'], testament: 'OT', order: 6, expectedChapters: 24 },
  { id: 'judges', name: 'Judges', abbreviations: ['Judg', 'Jdg'], testament: 'OT', order: 7, expectedChapters: 21 },
  { id: 'ruth', name: 'Ruth', abbreviations: ['Rth', 'Ru'], testament: 'OT', order: 8, expectedChapters: 4 },
  { id: '1samuel', name: '1 Samuel', abbreviations: ['1 Sam', '1Sam', '1Sa'], testament: 'OT', order: 9, expectedChapters: 31 },
  { id: '2samuel', name: '2 Samuel', abbreviations: ['2 Sam', '2Sam', '2Sa'], testament: 'OT', order: 10, expectedChapters: 24 },
  { id: '1kings', name: '1 Kings', abbreviations: ['1 Kgs', '1Kgs', '1Ki'], testament: 'OT', order: 11, expectedChapters: 22 },
  { id: '2kings', name: '2 Kings', abbreviations: ['2 Kgs', '2Kgs', '2Ki'], testament: 'OT', order: 12, expectedChapters: 25 },
  { id: '1chronicles', name: '1 Chronicles', abbreviations: ['1 Chr', '1Chr', '1Ch'], testament: 'OT', order: 13, expectedChapters: 29 },
  { id: '2chronicles', name: '2 Chronicles', abbreviations: ['2 Chr', '2Chr', '2Ch'], testament: 'OT', order: 14, expectedChapters: 36 },
  { id: 'ezra', name: 'Ezra', abbreviations: ['Ezr'], testament: 'OT', order: 15, expectedChapters: 10 },
  { id: 'nehemiah', name: 'Nehemiah', abbreviations: ['Neh'], testament: 'OT', order: 16, expectedChapters: 13 },
  { id: 'esther', name: 'Esther', abbreviations: ['Esth', 'Est'], testament: 'OT', order: 17, expectedChapters: 10 },
  { id: 'job', name: 'Job', abbreviations: ['Jb'], testament: 'OT', order: 18, expectedChapters: 42 },
  { id: 'psalm', name: 'Psalm', abbreviations: ['Ps', 'Psa', 'Psalms'], testament: 'OT', order: 19, expectedChapters: 150 },
  { id: 'proverbs', name: 'Proverbs', abbreviations: ['Prov', 'Pr'], testament: 'OT', order: 20, expectedChapters: 31 },
  { id: 'ecclesiastes', name: 'Ecclesiastes', abbreviations: ['Eccl', 'Ecc'], testament: 'OT', order: 21, expectedChapters: 12 },
  { id: 'songofsolomon', name: 'Song of Solomon', abbreviations: ['Song', 'SoS'], testament: 'OT', order: 22, expectedChapters: 8 },
  { id: 'isaiah', name: 'Isaiah', abbreviations: ['Isa'], testament: 'OT', order: 23, expectedChapters: 66 },
  { id: 'jeremiah', name: 'Jeremiah', abbreviations: ['Jer'], testament: 'OT', order: 24, expectedChapters: 52 },
  { id: 'lamentations', name: 'Lamentations', abbreviations: ['Lam'], testament: 'OT', order: 25, expectedChapters: 5 },
  { id: 'ezekiel', name: 'Ezekiel', abbreviations: ['Ezek', 'Eze'], testament: 'OT', order: 26, expectedChapters: 48 },
  { id: 'daniel', name: 'Daniel', abbreviations: ['Dan'], testament: 'OT', order: 27, expectedChapters: 12 },
  { id: 'hosea', name: 'Hosea', abbreviations: ['Hos'], testament: 'OT', order: 28, expectedChapters: 14 },
  { id: 'joel', name: 'Joel', abbreviations: ['Joe'], testament: 'OT', order: 29, expectedChapters: 3 },
  { id: 'amos', name: 'Amos', abbreviations: ['Am'], testament: 'OT', order: 30, expectedChapters: 9 },
  { id: 'obadiah', name: 'Obadiah', abbreviations: ['Obad', 'Ob'], testament: 'OT', order: 31, expectedChapters: 1 },
  { id: 'jonah', name: 'Jonah', abbreviations: ['Jon'], testament: 'OT', order: 32, expectedChapters: 4 },
  { id: 'micah', name: 'Micah', abbreviations: ['Mic'], testament: 'OT', order: 33, expectedChapters: 7 },
  { id: 'nahum', name: 'Nahum', abbreviations: ['Nah'], testament: 'OT', order: 34, expectedChapters: 3 },
  { id: 'habakkuk', name: 'Habakkuk', abbreviations: ['Hab'], testament: 'OT', order: 35, expectedChapters: 3 },
  { id: 'zephaniah', name: 'Zephaniah', abbreviations: ['Zeph', 'Zep'], testament: 'OT', order: 36, expectedChapters: 3 },
  { id: 'haggai', name: 'Haggai', abbreviations: ['Hag'], testament: 'OT', order: 37, expectedChapters: 2 },
  { id: 'zechariah', name: 'Zechariah', abbreviations: ['Zech', 'Zec'], testament: 'OT', order: 38, expectedChapters: 14 },
  { id: 'malachi', name: 'Malachi', abbreviations: ['Mal'], testament: 'OT', order: 39, expectedChapters: 4 },
  // New Testament
  { id: 'matthew', name: 'Matthew', abbreviations: ['Matt', 'Mt'], testament: 'NT', order: 40, expectedChapters: 28 },
  { id: 'mark', name: 'Mark', abbreviations: ['Mrk', 'Mk'], testament: 'NT', order: 41, expectedChapters: 16 },
  { id: 'luke', name: 'Luke', abbreviations: ['Lk'], testament: 'NT', order: 42, expectedChapters: 24 },
  { id: 'john', name: 'John', abbreviations: ['Jn', 'Joh'], testament: 'NT', order: 43, expectedChapters: 21 },
  { id: 'acts', name: 'Acts', abbreviations: ['Act'], testament: 'NT', order: 44, expectedChapters: 28 },
  { id: 'romans', name: 'Romans', abbreviations: ['Rom', 'Ro'], testament: 'NT', order: 45, expectedChapters: 16 },
  { id: '1corinthians', name: '1 Corinthians', abbreviations: ['1 Cor', '1Cor', '1Co'], testament: 'NT', order: 46, expectedChapters: 16 },
  { id: '2corinthians', name: '2 Corinthians', abbreviations: ['2 Cor', '2Cor', '2Co'], testament: 'NT', order: 47, expectedChapters: 13 },
  { id: 'galatians', name: 'Galatians', abbreviations: ['Gal'], testament: 'NT', order: 48, expectedChapters: 6 },
  { id: 'ephesians', name: 'Ephesians', abbreviations: ['Eph'], testament: 'NT', order: 49, expectedChapters: 6 },
  { id: 'philippians', name: 'Philippians', abbreviations: ['Phil', 'Php'], testament: 'NT', order: 50, expectedChapters: 4 },
  { id: 'colossians', name: 'Colossians', abbreviations: ['Col'], testament: 'NT', order: 51, expectedChapters: 4 },
  { id: '1thessalonians', name: '1 Thessalonians', abbreviations: ['1 Thess', '1Thess', '1Th'], testament: 'NT', order: 52, expectedChapters: 5 },
  { id: '2thessalonians', name: '2 Thessalonians', abbreviations: ['2 Thess', '2Thess', '2Th'], testament: 'NT', order: 53, expectedChapters: 3 },
  { id: '1timothy', name: '1 Timothy', abbreviations: ['1 Tim', '1Tim', '1Ti'], testament: 'NT', order: 54, expectedChapters: 6 },
  { id: '2timothy', name: '2 Timothy', abbreviations: ['2 Tim', '2Tim', '2Ti'], testament: 'NT', order: 55, expectedChapters: 4 },
  { id: 'titus', name: 'Titus', abbreviations: ['Tit'], testament: 'NT', order: 56, expectedChapters: 3 },
  { id: 'philemon', name: 'Philemon', abbreviations: ['Phlm', 'Phm'], testament: 'NT', order: 57, expectedChapters: 1 },
  { id: 'hebrews', name: 'Hebrews', abbreviations: ['Heb'], testament: 'NT', order: 58, expectedChapters: 13 },
  { id: 'james', name: 'James', abbreviations: ['Jas'], testament: 'NT', order: 59, expectedChapters: 5 },
  { id: '1peter', name: '1 Peter', abbreviations: ['1 Pet', '1Pet', '1Pe'], testament: 'NT', order: 60, expectedChapters: 5 },
  { id: '2peter', name: '2 Peter', abbreviations: ['2 Pet', '2Pet', '2Pe'], testament: 'NT', order: 61, expectedChapters: 3 },
  { id: '1john', name: '1 John', abbreviations: ['1 Jn', '1Jn', '1Jo'], testament: 'NT', order: 62, expectedChapters: 5 },
  { id: '2john', name: '2 John', abbreviations: ['2 Jn', '2Jn', '2Jo'], testament: 'NT', order: 63, expectedChapters: 1 },
  { id: '3john', name: '3 John', abbreviations: ['3 Jn', '3Jn', '3Jo'], testament: 'NT', order: 64, expectedChapters: 1 },
  { id: 'jude', name: 'Jude', abbreviations: ['Jud'], testament: 'NT', order: 65, expectedChapters: 1 },
  { id: 'revelation', name: 'Revelation', abbreviations: ['Rev', 'Re'], testament: 'NT', order: 66, expectedChapters: 22 },
]

const BY_ID = new Map(CANON.map((b) => [b.id, b]))

export function getBook(bookId: string): Book | null {
  return BY_ID.get(bookId) ?? null
}

// ALT-STAGE4-PART10: name/abbreviation lookup for the reference parser --
// tries the canonical name first, then each abbreviation, case-insensitive.
const NAME_LOOKUP = new Map<string, string>() // normalized name/abbrev -> bookId
for (const book of CANON) {
  NAME_LOOKUP.set(book.name.toLowerCase(), book.id)
  for (const abbr of book.abbreviations) {
    NAME_LOOKUP.set(abbr.toLowerCase().replace(/\s+/g, ''), book.id)
    NAME_LOOKUP.set(abbr.toLowerCase(), book.id)
  }
  NAME_LOOKUP.set(book.id, book.id)
}

export function findBookIdByName(input: string): string | null {
  const normalized = input.trim().toLowerCase()
  return NAME_LOOKUP.get(normalized) ?? NAME_LOOKUP.get(normalized.replace(/\s+/g, '')) ?? null
}
