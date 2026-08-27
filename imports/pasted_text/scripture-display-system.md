Design a complete desktop app called "Scripture Display System" — open-source
church presentation software owned by the RCCG CAYC Media Team. It is used
live during services to display Bible verses, song lyrics, and slides on a
projector, run by a media volunteer. Dark theme, calm and legible, not a
generic SaaS dashboard — this is control-panel software operated live in
front of a congregation, so clarity beats decoration everywhere.

====================================================
GLOBAL DESIGN SYSTEM (apply to every screen)
====================================================

COLOR PALETTE:
- App background: #12140F (near-black)
- Panel/card background: #1A1D16
- Borders: #2A2E22 (subtle hairlines, 1px)
- Primary text: #E9E7DF (off-white)
- Muted/secondary text: #8B9084
- Accent color (buttons, active states, highlights): #C9A34A (warm gold)
- Success/enabled state: green #6FC98A on dark green background #1F3A2A
- Projector output background: pure black #000000
- Projector output text: white #FFFFFF, gold #C9A34A for citations/references

TYPOGRAPHY:
- UI text: clean system sans-serif (Inter or Segoe UI style), compact, dense
- Projector display text: serif font (Georgia style), large, elegant
- Corner radius: 8px on buttons/inputs, 8-10px on cards/panels
- Card padding: 12-14px

NAVIGATION:
Left sidebar, 56px wide, icon-only, background #0C0E0A, with a gold square
logo badge ("CS") at the top. Two grouped sections of nav icons, separated
by a thin divider:

PRESENT section:
1. Search icon — Operator / Live Control
2. Musical note icon — Song Lyrics
3. Document icon — Sermon Notes & Slides
4. List/queue icon — Service Playlist
5. Clock icon — Timer / Countdown

MANAGE section:
6. Palette icon — Themes
7. Puzzle-piece icon — Plugins
8. Archive/folder icon — Recording & Archive
9. Phone icon — Remote Control
10. Gear icon — Settings & Integrations

Active icon gets a subtle gold-tinted background (#C9A34A at 10% opacity)
and gold icon color. Inactive icons are muted gray (#8B9084).

Every screen (except Projector Output and Remote Control) shares this same
sidebar + a top bar with the screen title on the left and a small status
pill on the right (gold dot + "Prototype build" or similar status text).

====================================================
SCREEN 1: OPERATOR / LIVE CONTROL (main screen)
====================================================
- Search bar with search icon, placeholder "Search a verse, e.g. John 3:16
  or love", plus a translation dropdown next to it listing: NKJV, KJV, NIV,
  ESV, AMP, ERV, MSG, NLT, Pidgin English
- A toggle row: "AI auto-detect" label with a toggle switch, and small text
  "Listening..." with a pulsing gold dot when active
- A vertical list of verse result cards: reference + translation code
  (e.g. "John 3:16 (KJV)"), verse text, and a gold "Send to display" button
- A right sidebar panel (260px wide) titled "NOW ON SCREEN" showing a small
  black preview box mirroring the live projector output
- Below the preview panel, a compact "Up Next" mini-list showing 2-3 queued
  items from the active playlist

====================================================
SCREEN 2: PROJECTOR OUTPUT (fullscreen, congregation-facing)
====================================================
- Pure black background, centered content, no UI chrome at all
- Large serif verse text, white, centered, generous line height
- Below it, smaller gold text showing reference and translation
- Note in the design: this screen has no sidebar/chrome — it is a separate
  fullscreen window shown on a second monitor/projector

====================================================
SCREEN 3: SONG LYRICS MANAGER
====================================================
- Top bar with "+ Import Song" gold button and a "Search online lyrics"
  button (outlined style, secondary)
- A search/filter bar for the song library
- A grid or list of song cards, each showing: song title, artist/writer,
  a small tag showing source ("Imported", "Online"), and a "..." menu icon
  for bulk actions (edit, delete, add to playlist)
- A "bulk select" checkbox mode toggle in the top bar for multi-select
  management actions
- An empty/import state card showing drag-and-drop file upload area with
  text "Drag a file here or click to import — supports PDF and other
  document formats"

====================================================
SCREEN 4: SERMON NOTES & ANNOUNCEMENT SLIDES EDITOR
====================================================
- A simple slide editor: left column shows a vertical stack of slide
  thumbnails (numbered), right side shows a large editable canvas for the
  selected slide with a text box, alignment controls, and a "+ Add Slide"
  button at the bottom of the thumbnail stack
- A top toolbar with text formatting options (bold, size, alignment) kept
  minimal — this is simpler than the song/lyrics editor by design

====================================================
SCREEN 5: SERVICE PLAYLIST BUILDER
====================================================
- A vertical drag-and-drop list representing the run of service, with each
  row showing a type icon (scripture/song/notes/timer/media), a title, and
  a drag handle icon on the left
- Rows are: e.g. "Opening Scripture — John 3:16", "Song — Amazing Grace",
  "Announcement Slides", "Timer — 5:00 countdown", "Sermon"
- A left rail or top bar showing a content picker with tabs: Scripture,
  Songs, Slides, Timer, Media — to drag new items into the playlist
- A "Start Service" gold button, prominent, top right

====================================================
SCREEN 6: TIMER / COUNTDOWN
====================================================
- Shown as a component/overlay usable both in the operator view and on the
  projector output
- Large countdown numbers (MM:SS), gold on black, with a thin circular
  progress ring around it
- Simple controls below: Start, Pause, Reset buttons

====================================================
SCREEN 7: THEMES
====================================================
- Subtitle text about picking a preset or building a fully custom theme
- Three preset buttons in a row: "Dark gold" (selected, gold border),
  "Clean light", "Bold blue"
- Below: a live preview box (black background) showing sample verse text
  styled in the selected theme
- A "Customize" section below with color swatch pickers for: background,
  text color, accent color, and a font selector dropdown — demonstrating
  the fully-custom theme capability

====================================================
SCREEN 8: PLUGINS
====================================================
- Subtitle about features shipping as plugins
- A vertical list of plugin rows, each with name + one-line description on
  the left, and a status pill on the right: green "Enabled" pill or
  outlined gray "Disabled" pill
- Plugin names: "Hello world sample" (enabled), "Recording and storage"
  (disabled), "Streaming capture (OBS)" (disabled), "Remote control"
  (disabled), "AI accuracy training" (disabled)

====================================================
SCREEN 9: RECORDING & ARCHIVE
====================================================
- A searchable/filterable list of past recorded services, filterable by
  date, preacher, and topic (filter chips at the top)
- Each row/card shows: date, preacher name, sermon title/topic, small icons
  indicating what's available (text transcript icon, audio icon, video/
  streaming-capture icon), and duration
- Clicking a row expands an inline audio player with a waveform visual and
  a "View transcript" button alongside it

====================================================
SCREEN 10: REMOTE CONTROL (mobile/phone-sized screen)
====================================================
- Narrow mobile viewport frame (like a phone screen)
- A simplified, large-touch-target version of the Operator screen: a search
  bar, a short list of verse results with large "Send" buttons, and a
  "Now Showing" card at the top
- A separate small "Join" screen showing a QR code centered, with text
  "Scan to control this service from your phone"

====================================================
SCREEN 11: SETTINGS & INTEGRATIONS
====================================================
- Sectioned settings page with cards for:
  - "Streaming Software" — shows OBS with a connected/green status dot,
    and a dropdown to change the connected tool
  - "NDI Output" — toggle switch to enable virtual camera output
  - "Bible Translations" — a checklist of installed translations (NKJV,
    KJV, NIV, ESV, AMP, ERV, MSG, NLT, Pidgin English) each with a small
    remove/manage icon, and an "+ Add Translation" button
  - "AI Speech Engine" — shows "Deepgram (Nova-3)" as connected, with a
    small "Swap provider" link

====================================================
GENERAL NOTES
====================================================
This is control-panel software operated live during a service by a
volunteer — legibility and fast recognition beat visual flourish
everywhere except the Projector Output screen, which should feel elegant
and traditional (serif type, generous whitespace) since it's what the
congregation actually reads.