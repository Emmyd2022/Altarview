// ALT-025: small sample of verses with multiple translations, so the Live
// screen's translation switcher has real alternate text to resolve to,
// rather than just changing a label. A production build would query the
// full Bible data module (see project doc Section 1, Scripture & Search)
// instead of this fixed table.

export interface VerseVariant {
  translation: string
  text: string
}

export const VERSE_DB: Record<string, VerseVariant[]> = {
  'John 3:16': [
    { translation: 'KJV', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { translation: 'NKJV', text: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.' },
    { translation: 'NIV', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
    { translation: 'ESV', text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
    { translation: 'AMP', text: 'For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life.' },
    { translation: 'NLT', text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.' },
    { translation: 'MSG', text: "This is how much God loved the world: He gave his Son, his one and only Son. And this is why: so that no one need be destroyed; by believing in him, anyone can have a whole and lasting life." },
  ],
  'Psalm 23:1': [
    { translation: 'KJV', text: 'The LORD is my shepherd; I shall not want.' },
    { translation: 'NKJV', text: 'The LORD is my shepherd; I shall not want.' },
    { translation: 'NIV', text: 'The LORD is my shepherd, I lack nothing.' },
    { translation: 'ESV', text: 'The LORD is my shepherd; I shall not want.' },
    { translation: 'AMP', text: 'The LORD is my Shepherd [to feed, guide, and shield me], I shall not want.' },
    { translation: 'NLT', text: 'The LORD is my shepherd; I have all that I need.' },
    { translation: 'MSG', text: "GOD, my shepherd! I don't need a thing." },
  ],
  'Romans 8:28': [
    { translation: 'KJV', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
    { translation: 'NIV', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
    { translation: 'NASB', text: 'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.' },
    { translation: 'NLT', text: 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.' },
    { translation: 'MSG', text: "That's why we can be so sure that every detail in our lives of love for God is worked into something good." },
  ],
  'Isaiah 40:31': [
    { translation: 'KJV', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
    { translation: 'ESV', text: 'But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.' },
    { translation: 'NIV', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
    { translation: 'MSG', text: "But those who wait on GOD get fresh strength. They spread their wings and soar like eagles, They run and don't get tired, they walk and don't lag behind." },
  ],
}

export function availableTranslationsFor(ref: string): VerseVariant[] {
  return VERSE_DB[ref] ?? []
}
