# Backbrain

**The Gamer's Backbrain** — a static games + tools portal. No build step, no
framework, no backend of its own: just HTML, CSS, and vanilla JS that runs
anywhere you can serve static files.

## What's in it

- **Games** (`Games.html`) — a searchable, filterable, favorite-able grid of
  browser games. Cards are keyboard- and touch-accessible and launch the game's
  real official site in a new tab.
- **Tools** (`Tabs/Tool Tabs/`) — HTML viewer, unit/color/QR/cipher utilities,
  dice roller, tier list, sprite maker, wheel spinner, whiteboard, timer, magic
  8-ball, a poll ("What's Next?"), and more.
- **More sites** — Movies, Proxy, Music, YouTube unblocker, gn-math, UGS, etc.
- **Chat** — an optional Firebase-backed chat, open to anyone who visits the page.
- **Team**, **Credits**, **Changelog**, and a **Settings** page.

Every page shares one nav + theme layer: `code/General Code/sidebar.js`.

## Running locally

The site is static, but a few tools (YouTube embeds, Chat, the service worker)
need a real HTTP origin rather than `file://`. Use the included dev server:

```powershell
./serve.ps1            # serves on http://localhost:5500
./serve.ps1 -Port 8080 # or pick a port
```

Then open <http://localhost:5500/>. The server sends no-cache headers so edits
show up on reload. Any static host (GitHub Pages, Netlify, …) works for
deployment — just serve the folder as-is.

## Project structure

```
index.html              Home (HUD bar: clock, battery, nav)
Games.html              Games grid
404.html                Not-found page
manifest.webmanifest    PWA manifest
sw.js                   Service worker (offline caching)
serve.ps1               Local static dev server
code/
  CSS/                  Page + shared styles (shared.css is loaded everywhere)
  General Code/         sidebar.js (shared nav/theme/search/stealth/PWA),
                        settings.js, team.js, credits.js, changelog.js
  Game Code/games.js    Game catalog + grid logic
Tabs/                   Settings, Team, Credits, Changelog
Tabs/Tool Tabs/         Every individual tool page
images/                 Card art, backgrounds, cursors, fonts, logo, app icon
```

## Common edits

### Add a game

Append an entry to the `cards` array in `code/Game Code/games.js`:

```js
{ id: 25, title: "Example", dateAdded: "2026-07-18", image: "images/example.svg",
  url: "https://example.com", tags: ["puzzle", "web"],
  description: "One-line description.", developer: "Studio" },
```

- `url: null` renders the card as "not launchable yet" (used for classic console
  titles with no legitimate free browser version — don't link ROM/piracy sites).
- Drop a `600×600` placeholder SVG in `images/` and point `image` at it.
- Tags are freeform; `web`, `emulator`, and `favorite` are reserved for the
  category tabs. Games also appear in the site-wide Ctrl+K search via the
  `Games` entry in `sidebar.js` (individual games aren't indexed, only the page).

### Add a tool

1. Create `Tabs/Tool Tabs/YOURTOOL.html` (copy an existing tool for the head +
   `sidebar.js` include).
2. Add a card to `Tabs/Tool Tabs/tools.html`.
3. Add it to `SEARCH_INDEX` in `code/General Code/sidebar.js` so Ctrl+K finds
   it (and, if it stores anything, add a friendly label to `KEY_LABELS` in
   `settings.js` so it shows up in Settings › Your Data).

### Themes

Themes live in the `THEMES` array in `code/General Code/settings.js`. Each
bundles an accent color, background, mode, font, background scene, and cursor.
Accent colors are contrast-checked (see the comments there before adding one).

## Features worth knowing about

- **Tab cloak** (Settings › Privacy & Stealth) — disguise the browser tab's
  title and icon as Google Docs, Classroom, Canvas, etc. Off by default; when
  off, the tab just shows the real logo + a "· Backbrain" title.
- **Panic key** (Settings › Privacy & Stealth) — one keypress jumps to a
  school-safe URL (default Google Classroom). Off by default. It fires **even
  while typing**, so it's limited to keys you won't hit by accident.
- **Installable / offline (PWA)** — `manifest.webmanifest` + `sw.js` make the
  site installable and cache same-origin assets for offline use. HTML is
  network-first (never stale); static assets are cache-first with a background
  refresh.
  - *Dev caveat:* while editing locally, a CSS/JS change can show one reload
    behind (the refresh lands on the next load). Hard-reload, or unregister the
    worker under DevTools › Application › Service Workers, while iterating.
- **Ctrl+K search**, **31+ themes**, **reduce motion**, and **data
  export/import/clear** all live in `sidebar.js` / Settings.

## Security — Firebase (Chatroom, Whiteboard sharing, What's Next?)

The `firebaseConfig` these tools use ships in client JS. **That's expected** —
a web Firebase config is not a secret. What actually protects the database is
your **Realtime Database security rules** (and, for Chatroom, **Storage
rules**), and those can only be set in the Firebase console (they're not in
this repo, so they can't be reviewed here — treat this as a checklist to
verify yourself).

Chatroom uses **Firebase Anonymous Authentication** — every visitor gets a
real, Firebase-issued account (`auth.uid`) automatically, no signup form.
This is a genuine security boundary, not just obscurity: `profiles/{uid}` can
only ever be written by the matching `auth.uid`, and `usernames/{name}` can
only be claimed if it's free or already yours, both enforced by the rules
themselves (not just client-side JS, which a modified client could bypass).
The chat content itself (`chat/`) is intentionally still a single open,
unencrypted space in this phase — access requires being signed in
(`auth != null`, which happens invisibly for every visitor) but nothing more;
per-server privacy tiers are a later phase, not yet built.

This site touches these top-level paths: `profiles/` + `usernames/` + `chat/`
(Chatroom), `boards/` (Whiteboard), and `polls/addnext` (What's Next?). At
minimum, scope the rules so nothing else in the database is readable or
writable:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "profiles": { "$uid": { ".read": true, ".write": "auth != null && auth.uid === $uid" } },
    "usernames": { "$name": { ".read": true, ".write": "auth != null && ((!data.exists() && newData.val() === auth.uid) || (data.exists() && data.val() === auth.uid))" } },
    "chat":   { ".read": "auth != null", ".write": "auth != null" },
    "boards": { "$board": { ".read": true, ".write": true } },
    "polls":  { "addnext": { ".read": true, ".write": true } }
  }
}
```

Storage needs its own rules (Storage Rules, not Realtime Database Rules — a
different syntax, set in Storage's own Rules tab): avatar uploads at
`avatars/{uid}/...` are restricted to `request.auth.uid == uid`, world-readable
otherwise. `Tabs/Tool Tabs/CHAT.html`'s own setup screen shows the exact
current copy of both rule sets to paste.

To further harden against spam, flooding, and quota abuse, consider:

- **Firebase App Check** — blocks requests from outside your actual site.
- **Validation rules** capping payload size/shape (e.g. `.validate` on message
  length) so a single client can't write huge or malformed data.
- **Budget alerts** on the Firebase project so runaway usage is caught early.

## Notes

- Many theme fonts, background scenes, and cursors are original placeholders,
  not the real licensed game assets — see the comments in `settings.js` /
  `sidebar.js`. New card art for recently added games is placeholder SVG too.
