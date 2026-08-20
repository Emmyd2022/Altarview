// ALT: real Bible data model for the Scripture page -- supports verse-
// range search ("John 3:16-20"), chapter-crossing next/previous verse
// navigation, and translation switching. Loaded content: full KJV text
// (public domain) for John 1, 3, and 4 -- three of the most commonly
// referenced chapters -- plus a handful of well-known standalone verses
// across other books in multiple translations, enough for realistic
// testing without requiring the entire Bible to be typed in.

export interface VerseRef {
  book: string
  chapter: number
  verse: number
}

export interface BibleVerse extends VerseRef {
  text: string
  translation: string
}

// Chapter-by-chapter full text (KJV, public domain).
const JOHN_1_KJV: string[] = [
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'The same was in the beginning with God.',
  'All things were made by him; and without him was not any thing made that was made.',
  'In him was life; and the life was the light of men.',
  'And the light shineth in darkness; and the darkness comprehended it not.',
  'There was a man sent from God, whose name was John.',
  'The same came for a witness, to bear witness of the Light, that all men through him might believe.',
  'He was not that Light, but was sent to bear witness of that Light.',
  'That was the true Light, which lighteth every man that cometh into the world.',
  'He was in the world, and the world was made by him, and the world knew him not.',
  'He came unto his own, and his own received him not.',
  'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name.',
  'Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.',
  'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.',
]

const JOHN_3_KJV: string[] = [
  'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:',
  'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.',
  'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.',
  'Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother\u2019s womb, and be born?',
  'Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.',
  'That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.',
  'Marvel not that I said unto thee, Ye must be born again.',
  'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.',
  'Nicodemus answered and said unto him, How can these things be?',
  'Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?',
  'Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.',
  'If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?',
  'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.',
  'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:',
  'That whosoever believeth in him should not perish, but have eternal life.',
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
  'And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.',
  'For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.',
  'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.',
]

const JOHN_4_KJV: string[] = [
  'When therefore the Lord knew how the Pharisees had heard that Jesus made and baptized more disciples than John,',
  '(Though Jesus himself baptized not, but his disciples,)',
  'He left Judaea, and departed again into Galilee.',
  'And he must needs go through Samaria.',
  'Then cometh he to a city of Samaria, which is called Sychar, near to the parcel of ground that Jacob gave to his son Joseph.',
  'Now Jacob\u2019s well was there. Jesus therefore, being wearied with his journey, sat thus on the well: and it was about the sixth hour.',
  'There cometh a woman of Samaria to draw water: Jesus saith unto her, Give me to drink.',
  '(For his disciples were gone away unto the city to buy meat.)',
  'Then saith the woman of Samaria unto him, How is it that thou, being a Jew, askest drink of me, which am a woman of Samaria? for the Jews have no dealings with the Samaritans.',
  'Jesus answered and said unto her, If thou knewest the gift of God, and who it is that saith to thee, Give me to drink; thou wouldest have asked of him, and he would have given thee living water.',
  'The woman saith unto him, Sir, thou hast nothing to draw with, and the well is deep: from whence then hast thou that living water?',
  'Art thou greater than our father Jacob, which gave us the well, and drank thereof himself, and his children, and his cattle?',
  'Jesus answered and said unto her, Whosoever drinketh of this water shall thirst again:',
  'But whosoever drinketh of the water that I shall give him shall never thirst; but the water that I shall give him shall be in him a well of water springing up into everlasting life.',
]

interface ChapterData {
  book: string
  chapter: number
  verses: string[] // index 0 = verse 1
}

const LOADED_CHAPTERS: ChapterData[] = [
  { book: 'John', chapter: 1, verses: JOHN_1_KJV },
  { book: 'John', chapter: 3, verses: JOHN_3_KJV },
  { book: 'John', chapter: 4, verses: JOHN_4_KJV },
]

// Well-known standalone verses in multiple translations, for translation-
// switching tests outside the fully-loaded John chapters.
const MULTI_TRANSLATION_VERSES: BibleVerse[] = [
  { book: 'Psalm', chapter: 23, verse: 1, translation: 'KJV', text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Psalm', chapter: 23, verse: 1, translation: 'NIV', text: 'The LORD is my shepherd, I lack nothing.' },
  { book: 'Psalm', chapter: 23, verse: 1, translation: 'ESV', text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'KJV', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'NIV', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { book: 'Romans', chapter: 8, verse: 28, translation: 'NASB', text: 'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'KJV', text: 'I can do all things through Christ which strengtheneth me.' },
  { book: 'Philippians', chapter: 4, verse: 13, translation: 'NASB', text: 'I can do all things through Him who strengthens me.' },
  { book: 'Isaiah', chapter: 40, verse: 31, translation: 'KJV', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
  { book: 'Isaiah', chapter: 40, verse: 31, translation: 'ESV', text: 'But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.' },
  { book: 'Proverbs', chapter: 3, verse: 5, translation: 'KJV', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { book: 'Proverbs', chapter: 3, verse: 6, translation: 'KJV', text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
  { book: 'Proverbs', chapter: 3, verse: 5, translation: 'NIV', text: 'Trust in the LORD with all your heart and lean not on your own understanding.' },
  { book: 'Proverbs', chapter: 3, verse: 6, translation: 'NIV', text: 'in all your ways submit to him, and he will make your paths straight.' },
]

export function bookChapterKey(book: string, chapter: number): string {
  return `${book.toLowerCase()}|${chapter}`
}

const CHAPTER_MAP = new Map<string, ChapterData>()
for (const c of LOADED_CHAPTERS) CHAPTER_MAP.set(bookChapterKey(c.book, c.chapter), c)

// Order the loaded chapters follow, for crossing chapter boundaries.
const CHAPTER_ORDER: VerseRef[] = LOADED_CHAPTERS.map((c) => ({ book: c.book, chapter: c.chapter, verse: 1 }))

export function getVerseText(book: string, chapter: number, verse: number, translation: string): string | null {
  // KJV comes from the fully-loaded chapters when available.
  const chapterData = CHAPTER_MAP.get(bookChapterKey(book, chapter))
  if (chapterData && translation === 'KJV' && chapterData.verses[verse - 1] !== undefined) {
    return chapterData.verses[verse - 1]
  }
  const match = MULTI_TRANSLATION_VERSES.find(
    (v) => v.book.toLowerCase() === book.toLowerCase() && v.chapter === chapter && v.verse === verse && v.translation === translation,
  )
  return match ? match.text : null
}

export function chapterVerseCount(book: string, chapter: number): number {
  return CHAPTER_MAP.get(bookChapterKey(book, chapter))?.verses.length ?? 0
}

export function isChapterLoaded(book: string, chapter: number): boolean {
  return CHAPTER_MAP.has(bookChapterKey(book, chapter))
}

export function availableTranslationsForVerse(book: string, chapter: number, verse: number): string[] {
  const list: string[] = []
  if (getVerseText(book, chapter, verse, 'KJV')) list.push('KJV')
  for (const t of ['NIV', 'ESV', 'NASB']) {
    if (getVerseText(book, chapter, verse, t) && !list.includes(t)) list.push(t)
  }
  return list
}

// ALT: reference parsing -- "John 3:16-20", "John 3:16", "Psalm 23:1",
// "Romans 8 28" (space-separated, ProPresenter-style shorthand also works).
export function parseReference(input: string): { book: string; chapter: number; startVerse: number; endVerse: number } | null {
  const cleaned = input.trim()
  const match = cleaned.match(/^([1-3]?\s?[A-Za-z]+)\.?\s+(\d+)[:\s](\d+)(?:\s*[-\u2013]\s*(\d+))?$/)
  if (!match) return null
  const [, rawBook, chapterStr, startStr, endStr] = match
  const book = rawBook.trim().replace(/\s+/g, ' ')
  const chapter = parseInt(chapterStr, 10)
  const startVerse = parseInt(startStr, 10)
  const endVerse = endStr ? parseInt(endStr, 10) : startVerse
  return { book, chapter, startVerse, endVerse }
}

export function getVerseRange(book: string, chapter: number, startVerse: number, endVerse: number, translation: string): BibleVerse[] {
  const result: BibleVerse[] = []
  for (let v = startVerse; v <= endVerse; v++) {
    const text = getVerseText(book, chapter, v, translation)
    if (text) result.push({ book, chapter, verse: v, text, translation })
  }
  return result
}

// ALT: chapter-crossing next/previous verse -- matches ProPresenter's
// behavior (Next Verse on the last verse of a chapter moves to verse 1 of
// the next loaded chapter, and vice versa for Previous).
export function nextVerseRef(ref: VerseRef): VerseRef | null {
  const count = chapterVerseCount(ref.book, ref.chapter)
  if (count && ref.verse < count) return { ...ref, verse: ref.verse + 1 }
  const idx = CHAPTER_ORDER.findIndex((c) => c.book.toLowerCase() === ref.book.toLowerCase() && c.chapter === ref.chapter)
  if (idx !== -1 && idx < CHAPTER_ORDER.length - 1) {
    const next = CHAPTER_ORDER[idx + 1]
    return { book: next.book, chapter: next.chapter, verse: 1 }
  }
  return null
}

export function previousVerseRef(ref: VerseRef): VerseRef | null {
  if (ref.verse > 1) return { ...ref, verse: ref.verse - 1 }
  const idx = CHAPTER_ORDER.findIndex((c) => c.book.toLowerCase() === ref.book.toLowerCase() && c.chapter === ref.chapter)
  if (idx > 0) {
    const prev = CHAPTER_ORDER[idx - 1]
    const count = chapterVerseCount(prev.book, prev.chapter)
    return { book: prev.book, chapter: prev.chapter, verse: count }
  }
  return null
}

export function refLabel(ref: VerseRef): string {
  return `${ref.book} ${ref.chapter}:${ref.verse}`
}

export function rangeLabel(book: string, chapter: number, startVerse: number, endVerse: number): string {
  return startVerse === endVerse ? `${book} ${chapter}:${startVerse}` : `${book} ${chapter}:${startVerse}-${endVerse}`
}
