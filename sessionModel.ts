// ALT: simplified per instruction -- Sessions are now pure time-keeping
// for the Stage Control countdown. Sending scripture/songs/slides now
// happens directly from the unified Operator screen (with the new
// Send to Stage option), not by attaching resources to a session here.

export interface ServiceSession {
  id: string
  title: string
  durationMinutes: number
}

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export const DEFAULT_SESSIONS: ServiceSession[] = [
  { id: id('session'), title: 'Opening Prayer', durationMinutes: 5 },
  { id: id('session'), title: 'Praise & Worship', durationMinutes: 15 },
  { id: id('session'), title: 'Announcements', durationMinutes: 4 },
  { id: id('session'), title: 'Offering', durationMinutes: 6 },
  { id: id('session'), title: 'Sermon', durationMinutes: 45 },
]

export function newSession(title: string, durationMinutes: number): ServiceSession {
  return { id: id('session'), title, durationMinutes }
}
