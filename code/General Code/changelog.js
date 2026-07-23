const CHANGELOG = [
  {
    date: "2026-07-21",
    items: [
      "Chat: removed the room passphrase — joining now only asks for a nickname, since the chat is a single shared room for anyone who visits the page.",
      "Renamed Chat to \"Chatroom,\" gave it a real icon instead of the Discord logo, and moved it up into the sidebar's main section.",
      "Chatroom: replaced the old passphrase model with real (anonymous, no-signup) accounts — every visitor gets a genuine account, and display names are first-come-first-served so nobody can post under a name someone else already claimed.",
      "Chatroom: added editable profiles — picture, bio, status line, pronouns, and an accent color.",
      "Chatroom: messages from the same person posted back-to-back now only show the name and picture above the first one.",
    ],
  },
  {
    date: "2026-07-15",
    items: [
      "Reordered the sidebar — Discord and Settings now sit at the very bottom instead of being mixed in with the main tool links.",
      "Removed the homepage's \"Everything Here\" directory grid — redundant with the top toolbar, which already links everywhere.",
      "Trimmed the homepage toolbar down to Home, Our Team, Tools, and Disclaimer (dropped Entertainment, Partners, Comments, Forms, and the duplicate Discord button).",
      "Added a \"Truffled\" tab under More Sites, embedding truffled.lol.",
      "Added real background photos (with a blurred dark-scrim overlay for text contrast) to 14 themes: Friday Night Funkin', Undertale, Hyrule Field, Green Hill Zone, Windows, Minecraft, Among Us, Galaxy, Cuphead, Pokémon, Celeste, Kirby, Halo, and Hollow Knight.",
      "Swapped 9 theme fonts that were hard to read (Friday Night Funkin', Cuphead, Synthwave, and all the holiday themes) for clearer alternatives, and lightened Celeste's font too.",
      "Added live theme preview — hovering a theme tile in Settings now shows it live (color, font, background, cursor) before you commit by clicking.",
      "Reworked Ctrl+K search to fall back to fuzzy/typo-tolerant matching when there's no exact or prefix match.",
      "Added local \"most used tools\" tracking, surfaced on the homepage under the hero stats once you've used a few.",
      "Added a live presence indicator to the Whiteboard's shared boards — see who else (auto-assigned name/color) is currently on the same board with you.",
      "Heads up: Portal's new background photo got removed partway through, so it's back on its original gradient for now. The original hand-drawn cursor SVGs for several themes (Nightshade, Frost, Undertale, Windows, Galaxy, Hollow Knight, Wii, plus half of Toxic/Terminal/FNF/Minecraft/Pokémon/Celeste) were also deleted during a cursor-pack experiment that got undone — those themes have no cursor for now until real replacements go in.",
    ],
  },
  {
    date: "2026-07-11",
    items: [
      "Added a full site theme system — Settings > Appearance now lists every theme with a live color + cursor preview, and picking one sets the color palette, background scene, font, and cursor together instead of separately.",
      "Added 31 themes: mood/color ones (Frost, Toxic, Molten, Volt, Nightshade, Terminal, Emerald, Indigo, Amber, Slate, and more) plus franchise and holiday ones (Wii, Undertale, Hyrule Field, Green Hill Zone, Minecraft, Among Us, Discord, Portal, Kirby, Pokémon, Cuphead, Celeste, Hollow Knight, Halo, Synthwave, Halloween, Christmas, Valentine's Day, New Year's, Easter, Summer, Friday Night Funkin', and Galaxy).",
      "Every theme's colors are checked against real contrast rules, not just picked by eye — button text now automatically switches between black and white depending on how light the accent is, instead of always assuming white works.",
      "Added themed cursors with separate idle and hover art, and fixed a bug where the hover cursor silently never showed up on buttons/links.",
      "Added a real light-mode variant for the Wii theme (white background, dark text) — every other theme stays dark-mode.",
      "Fixed several spots that stayed hardcoded to the old maroon no matter which theme was active: the sidebar panel, search popup, 404 glow, homepage hero glow, top-bar icon buttons, and the clock glow.",
      "Fixed the Team page member photos, which were silently broken (wrong relative path) for every profile.",
      "Cut unnecessary font loading — a themed font now only loads for visitors actually using that theme, instead of loading all 17 theme fonts on every single page view.",
      "Added lazy-loading and fixed dimensions to team avatars, tier list images, and both site logos to cut down on layout jank while the page loads.",
      "Heads up: most of the new themes' background art, fonts, and cursor icons are original placeholders for now, not the real licensed assets — real versions can swap in later.",
    ],
  },
  {
    date: "2026-07-10",
    items: [
      "Added Ctrl+K site-wide search — jump to any page instantly, plus jump straight to a specific game or team member.",
      "Sprite Maker: added undo/redo (Ctrl+Z / Ctrl+Y), with dedicated buttons too.",
      "Removed the UGS and gn-math cards from the Tools page (both still reachable from the sidebar).",
    ],
  },
  {
    date: "2026-07-09",
    items: [
      "Built the homepage — glowing HUD nav bar with a live clock and battery indicator.",
      "Added gn-math, UGS, Movies, and a \"More Sites\" accordion (Music, Fern, Site 4, Site 5) to the sidebar.",
      "Built the Team page — grouped by role, click a member for a full profile popup.",
      "Redesigned the Games page: dropped search/sort/tags in favor of hover-reveal info cards, dark red background.",
      "Gave Team and Credits the same dark red background as Games.",
      "Set up a local static server (serve.ps1) so tools that need a real HTTP origin (YouTube embeds, Chat) actually work.",
      "Fixed the YouTube Unblocker's \"Error 153\" (missing referrer policy).",
      "Fixed asset paths across the site after CSS, General Code, and Game Code moved under a new code/ folder.",
      "Added the sidebar logo, with the site's actual title, tagline, and branding wired in.",
    ],
  },
  {
    date: "2026-07-07",
    items: [
      "Built Sprite Maker — a Piskel-style pixel art editor with animation frames and GIF export.",
      "Built the private Chat — Firebase-backed, passphrase-encrypted, Discord-style channels and presence.",
      "Fixed the Dice Roller's RNG and added a multi-roll calculator (add/subtract/multiply/divide/average).",
      "Added history, search, and a copyable passphrase popup to Chat and Proxy.",
      "Generated placeholder card art for games that were missing images.",
    ],
  },
];

// Exposed so sidebar.js can load this file on every page (not just
// changelog.html) purely to read the newest entry's date, for the unread
// badge on the sidebar's Changelog link - a single source of truth instead
// of hand-keeping "the latest date" as a second copy somewhere else.
window.CHANGELOG = CHANGELOG;

const listEl = document.getElementById("changelogList");

// Guarded because sidebar.js loads this file on every page for the date
// above - changelogList only actually exists on changelog.html itself.
if (listEl) {
  listEl.innerHTML = CHANGELOG.map(entry => `
    <div class="changelog-entry">
      <div class="changelog-date">${entry.date}</div>
      <ul class="changelog-list">
        ${entry.items.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  // Actually being on this page is what "seen" means - recorded here
  // rather than coordinated from sidebar.js, since this is the one place
  // that's unconditionally got the real CHANGELOG data already.
  if (CHANGELOG.length) localStorage.setItem("site_changelog_seen", CHANGELOG[0].date);
}
