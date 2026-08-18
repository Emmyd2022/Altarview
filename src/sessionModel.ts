// ALT-022: the service playlist is organized around named Sessions
// (Opening Prayer, Praise & Worship, Offering, Sermon...) rather than a
// flat list of unrelated items. Each session holds multiple resources
// together and carries its own allocated duration -- the duration lives
// on the session, not on individual resources, since it's the session as
// a whole that the Stage countdown times.

export type ResourceType = 'scripture' | 'song' | 'slide' | 'media' | 'combined' | 'up-next'

export interface SessionResource {
  id: string
  type: ResourceType
  title: string
  detail?: string
  scriptureRef?: string
  songRef?: string
}

export interface ServiceSession {
  id: string
  title: string
  durationMinutes: number
  resources: SessionResource[]
}

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export const DEFAULT_SESSIONS: ServiceSession[] = [
  {
    id: id('session'),
    title: 'Opening Prayer',
    durationMinutes: 5,
    resources: [
      { id: id('res'), type: 'slide', title: 'Prayer Points', detail: '3 points' },
      { id: id('res'), type: 'scripture', title: 'Opening Scripture', scriptureRef: 'John 3:16 (KJV)' },
    ],
  },
  {
    id: id('session'),
    title: 'Praise & Worship',
    durationMinutes: 15,
    resources: [
      { id: id('res'), type: 'song', title: 'Amazing Grace', songRef: 'Amazing Grace' },
      { id: id('res'), type: 'song', title: 'Way Maker', songRef: 'Way Maker' },
      {
        id: id('res'),
        type: 'combined',
        title: 'Worship & Word',
        songRef: 'Oceans (Where Feet May Fail)',
        scriptureRef: 'Isaiah 40:31 (ESV)',
      },
    ],
  },
  {
    id: id('session'),
    title: 'Announcements',
    durationMinutes: 4,
    resources: [{ id: id('res'), type: 'slide', title: 'Announcement Slides' }],
  },
  {
    id: id('session'),
    title: 'Offering',
    durationMinutes: 6,
    resources: [{ id: id('res'), type: 'song', title: 'Offering Song', songRef: 'Way Maker' }],
  },
  {
    id: id('session'),
    title: 'Sermon',
    durationMinutes: 45,
    resources: [
      { id: id('res'), type: 'scripture', title: 'Sermon Scripture', scriptureRef: 'Romans 8:28 (NIV)' },
      { id: id('res'), type: 'media', title: 'Sermon', detail: 'Pastor John Adeyemi' },
    ],
  },
]

export const RESOURCE_LIBRARY: Record<Exclude<ResourceType, 'combined'>, { label: string; scriptureRef?: string; songRef?: string; detail?: string }[]> = {
  scripture: [
    { label: 'John 3:16', scriptureRef: 'John 3:16 (KJV)' },
    { label: 'Romans 8:28', scriptureRef: 'Romans 8:28 (NIV)' },
    { label: 'Psalm 23:1', scriptureRef: 'Psalm 23:1 (KJV)' },
    { label: 'Isaiah 40:31', scriptureRef: 'Isaiah 40:31 (ESV)' },
  ],
  song: [
    { label: 'Amazing Grace', songRef: 'Amazing Grace' },
    { label: 'Way Maker', songRef: 'Way Maker' },
    { label: 'Great Is Thy Faithfulness', songRef: 'Great Is Thy Faithfulness' },
  ],
  slide: [
    { label: 'Announcement Slides' },
    { label: 'Welcome Screen' },
    { label: 'Prayer Points' },
  ],
  media: [
    { label: 'Sermon (Pastor Adeyemi)', detail: 'Pastor John Adeyemi' },
    { label: 'Offering video' },
  ],
  // ALT-042: Up Next transitions are now an addable resource within a
  // session's run, alongside scripture/song/slide/media -- e.g. dropping
  // one in right before "Offering" plays the "UP NEXT \u2192 Offering"
  // transition at that point in the run of service.
  'up-next': [
    { label: 'Up Next: Offering', detail: 'Gold Wipe style' },
    { label: 'Up Next: Sermon', detail: 'Gold Wipe style' },
    { label: 'Up Next: Praise & Worship', detail: 'Clean Slide style' },
  ],
}

export function newSession(title: string, durationMinutes: number): ServiceSession {
  return { id: id('session'), title, durationMinutes, resources: [] }
}

export function newResourceId() {
  return id('res')
}
