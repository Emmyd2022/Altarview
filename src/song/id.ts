// ALT-STAGE5-PART7: stable ID generation for Songs and Sections.
// Previously, song IDs were generated via `qe-${Date.now()}` /
// `import-${Date.now()}` / `dup-${Date.now()}` -- collision-prone
// (two songs added in the same millisecond) and not a robust identifier.
// `crypto.randomUUID()` is a standard Web Crypto API, available in every
// modern browser and in Node 14.17+ without any dependency -- a
// platform-safe choice that works identically today (browser prototype)
// and later (Electron, which embeds a modern Chromium/Node runtime).

export function newSongId(): string {
  return crypto.randomUUID()
}

export function newSectionId(): string {
  return crypto.randomUUID()
}

export function newArrangementId(): string {
  return crypto.randomUUID()
}
