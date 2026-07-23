// Friendly labels for the keys tools actually use today. Anything not
// listed here (including future keys from tools that don't exist yet)
// still shows up under its raw key name rather than being hidden — the
// export/import/clear actions below always operate on the full, real
// localStorage contents, never just this label list.
const KEY_LABELS = {
  gamePortalFavorites: "Games — Favorites",
  backbrain_yt_api_key: "Youtube Unblocker — API key",
  norepted_q: "Youtube Unblocker — Watch queue",
  backbrain_subs: "Youtube Unblocker — Subscriptions",
  backbrain_playlists: "Youtube Unblocker — Playlists",
  norepted_arc: "Youtube Unblocker — History",
  tierlist_items: "Tier List — Items",
  tierlist_tiers: "Tier List — Tiers",
  spritemaker_project: "Sprite Maker — Project",
  wheelspinner_entries: "Wheel Spinner — Options",
  whiteboard_drawing: "Whiteboard — Drawing",
  whiteboard_artist_identity: "Whiteboard — Artist name & color",
  addnext_poll_local: "What's Next? — Your local votes",
  addnext_voter_id: "What's Next? — Anonymous voter ID",
  proxy_bookmarks: "Proxy — Bookmarks",
  proxy_history: "Proxy — History",
  web_lab_ultra_save: "HTML Viewer — Saved code",
  chat_firebase_config: "Chatroom — Firebase config",
  site_theme_accent: "Appearance — Theme accent color",
  site_theme_bg: "Appearance — Theme background color",
  site_theme_mode: "Appearance — Theme light/dark mode",
  site_theme_font: "Appearance — Theme font",
  site_theme_zoom: "Appearance — Theme zoom",
  site_theme_bg_image: "Appearance — Theme background scene",
  site_reduce_motion: "Appearance — Reduce motion",
  site_cursor: "Appearance — Cursor (idle)",
  site_cursor_hover: "Appearance — Cursor (hover)",
  site_tab_cloak: "Privacy — Tab cloak",
  site_panic_enabled: "Privacy — Panic key enabled",
  site_panic_key: "Privacy — Panic key",
  site_panic_url: "Privacy — Panic destination URL",
  calc_history: "Calculator — History",
  pwgen_options: "Password Generator — Options",
  markdown_draft: "Markdown Previewer — Draft",
  habits_data: "Habit Tracker — Habits & history",
  emoji_recent: "Emoji Picker — Recently used",
  teamgen_names: "Team Generator — Name list",
  rps_score: "Rock Paper Scissors — Score",
  typingtest_best: "Typing Test — Best WPM",
  numberguesser_best: "Number Guesser — Best scores",
  quotes_favorites: "Quote Generator — Favorites",
  flashcards_decks: "Flashcards — Decks",
  ugs_favorites: "UGS — Favorites",
  ugs_recent: "UGS — Recently played",
};

function friendlyLabel(key) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  if (key.startsWith("status_")) return `Youtube Unblocker — Video status (${key.slice(7)})`;
  if (key.startsWith("setting_")) return `Youtube Unblocker — Setting (${key.slice(8)})`;
  return key;
}

function formatBytes(n) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

const keyListEl = document.getElementById("settingsKeyList");
const exportBtn = document.getElementById("exportDataBtn");
const importBtn = document.getElementById("importDataBtn");
const importInput = document.getElementById("importFileInput");
const clearBtn = document.getElementById("clearDataBtn");
const accentColorInput = document.getElementById("accentColorInput");
const themeCustomRow = document.getElementById("themeCustomRow");
const themeListEl = document.getElementById("themeList");
const reduceMotionChk = document.getElementById("reduceMotionChk");

const ACCENT_KEY = "site_theme_accent";
const BG_KEY = "site_theme_bg";
const MODE_KEY = "site_theme_mode";
const FONT_KEY = "site_theme_font";
const ZOOM_KEY = "site_theme_zoom";
const BG_IMAGE_KEY = "site_theme_bg_image";
const MOTION_KEY = "site_reduce_motion";
const CURSOR_KEY = "site_cursor";
const CURSOR_HOVER_KEY = "site_cursor_hover";
const DEFAULT_ACCENT = "#e64848";
const DEFAULT_BG = "#200a0a";

// A theme now bundles four things, not just a color pair: accent+bg (mode
// flips the whole palette to light for Wii, the only theme that isn't a
// dark backdrop), an optional font, an optional background scene, and an
// optional idle/hover cursor pair. Selecting a theme sets ALL of it at
// once - see setTheme() below.
//
// Every accent/bg pair here is contrast-checked the same way as the
// original 13-theme palette: accent needs >=4.5:1 against its own bg (used
// as plain text for nav links/headings), and getReadableText(accent) needs
// >=4.5:1 too (used as a solid button background). Discord's accent got
// brightened from the real Discord blurple (#5865f2, capped at 4.56:1
// against pure black) to #6a75f5 for headroom; Wii's accent got deepened
// from a lighter Wii-blue for the same reason, since it's used as TEXT on
// a near-white background instead of white text on a dark one.
//
// Fonts and background scenes are NOT the real licensed/extracted game
// assets - see the font-loading comment in sidebar.js for why on the font
// side; the gradients below are original CSS scenes, not screenshots, for
// the same reason the cursors are original drawings, not ripped sprites.
const THEMES = [
  {
    name: "Backbrain Maroon", accent: "#e64848", bg: "#200a0a", mode: "dark",
    font: null, bgImage: null, cursor: null, cursorHover: null,
  },
  {
    name: "Wii", accent: "#0d5c94", bg: "#eaf6ff", mode: "light",
    font: "'Nintendo DS BIOS', sans-serif", zoom: "122%", bgImage: null,
    cursor: null, cursorHover: null,
  },
  {
    name: "Undertale", accent: "#33b6ff", bg: "#050505", mode: "dark",
    font: "'Monster Friend', monospace", zoom: "85%",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/undertale-bg.jpeg")}")`,
    cursor: null, cursorHover: null,
  },
  {
    name: "Hyrule Field", accent: "#e0b93c", bg: "#10200f", mode: "dark",
    font: "'Cinzel', serif",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/hyrule-bg.jpeg")}")`,
    cursor: "mastersword-sheathed.svg", cursorHover: "mastersword-unsheathed.svg",
  },
  {
    name: "Green Hill Zone", accent: "#4ade80", bg: "#05201a", mode: "dark",
    font: null,
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/sonic-bg.jpeg")}")`,
    cursor: "sonic-glove.svg", cursorHover: "sonic-glove-thumbsup.svg",
  },
  {
    name: "Frost", accent: "#7fd8f7", bg: "#1e343b", mode: "dark",
    font: null, bgImage: null, cursor: null, cursorHover: null,
  },
  {
    name: "Toxic", accent: "#84cc16", bg: "#1f2e06", mode: "dark",
    font: null, bgImage: null, cursor: "toxic.svg", cursorHover: null,
  },
  {
    name: "Molten", accent: "#f97316", bg: "#281204", mode: "dark",
    font: null, bgImage: null, cursor: "molten.svg", cursorHover: "molten-hot.svg",
  },
  {
    name: "Volt", accent: "#eab308", bg: "#3d2f03", mode: "dark",
    font: null, bgImage: null, cursor: "volt.svg", cursorHover: "volt-glitch.svg",
  },
  {
    name: "Nightshade", accent: "#a855f7", bg: "#180c23", mode: "dark",
    font: null, bgImage: null, cursor: null, cursorHover: null,
  },
  {
    name: "Terminal", accent: "#39ff6a", bg: "#050805", mode: "dark",
    font: null, bgImage: null, cursor: "terminal.svg", cursorHover: null,
  },
  {
    name: "Windows", accent: "#1fa6a6", bg: "#041a1c", mode: "dark",
    font: null,
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/windows-bg.jpeg")}")`,
    cursor: null, cursorHover: null,
  },
  {
    name: "Minecraft", accent: "#5b9c34", bg: "#170f06", mode: "dark",
    font: "'Minecraft', monospace",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/minecraft-bg.jpeg")}")`,
    cursor: null, cursorHover: "minecraft-hand.svg",
  },
  {
    name: "Among Us", accent: "#22d3d3", bg: "#05060f", mode: "dark",
    font: "'Poppins', sans-serif",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/amongus-bg.jpeg")}")`,
    cursor: "amongus.svg", cursorHover: "amongus-imposter.svg",
  },
  {
    name: "Discord", accent: "#6a75f5", bg: "#0a0c1c", mode: "dark",
    font: "'Rubik', sans-serif", bgImage: null, cursor: null, cursorHover: null,
  },
  {
    name: "Galaxy", accent: "#d946ef", bg: "#0d0620", mode: "dark",
    font: null,
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/galaxy-bg.jpeg")}")`,
    cursor: null, cursorHover: null,
  },
  {
    name: "Friday Night Funkin'", accent: "#a34bff", bg: "#150826", mode: "dark",
    font: "'Baloo 2', cursive",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/fnf-bg.jpeg")}")`,
    cursor: null, cursorHover: "fnf-arrow-up.svg",
  },
  {
    name: "Portal", accent: "#3ea6ff", bg: "#14171a", mode: "dark",
    font: "'Orbitron', sans-serif",
    bgImage: "radial-gradient(ellipse 120px 200px at 25% 60%, rgba(255,138,0,0.4) 0%, transparent 70%), radial-gradient(ellipse 120px 200px at 75% 40%, rgba(62,166,255,0.4) 0%, transparent 70%), linear-gradient(180deg, #2a2d30 0%, #1a1d20 50%, #14171a 100%)",
    cursor: "portal-orange.svg", cursorHover: "portal-blue.svg",
  },
  {
    name: "Kirby", accent: "#ff85c0", bg: "#2e0d1e", mode: "dark",
    font: "'Fredoka', sans-serif",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/kirby-bg.jpeg")}")`,
    cursor: "kirby-star.svg", cursorHover: "kirby-star-tilted.svg",
  },
  {
    name: "Pokemon", accent: "#e6393c", bg: "#1f0808", mode: "dark",
    font: null,
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/pokemon-bg.jpeg")}")`,
    cursor: null, cursorHover: "pokeball-open.svg",
  },
  {
    name: "Cuphead", accent: "#ea3a47", bg: "#100a03", mode: "dark",
    font: "'Bungee', cursive",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/cuphead-bg.jpeg")}")`,
    cursor: "cuphead-peashooter.svg", cursorHover: "cuphead-peashooter-ex.svg",
  },
  {
    name: "Celeste", accent: "#2e9fd6", bg: "#0a1622", mode: "dark",
    font: "'VT323', monospace",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/celeste-bg.jpeg")}")`,
    cursor: null, cursorHover: "celeste-crystal-heart.svg",
  },
  {
    name: "Hollow Knight", accent: "#5ec8d8", bg: "#0a0c0e", mode: "dark",
    font: "'Cinzel', serif",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/hollowknight-bg.jpeg")}")`,
    cursor: null, cursorHover: null,
  },
  {
    name: "Halo", accent: "#29b6b0", bg: "#0e1614", mode: "dark",
    font: "'Black Ops One', sans-serif",
    bgImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url("${window.BackbrainTheme.resolveAsset("images/backgrounds/halo-bg.jpeg")}")`,
    cursor: "halo-reticle.svg", cursorHover: "halo-energy-sword.svg",
  },
  {
    name: "Synthwave", accent: "#ff2d95", bg: "#1a0b2e", mode: "dark",
    font: "'Audiowide', cursive",
    bgImage: "radial-gradient(circle at 50% 25%, rgba(255,45,149,0.4) 0%, transparent 35%), linear-gradient(180deg, #2d0a4e 0%, #4a0f6b 30%, #1a0b2e 60%, #1a0b2e 100%)",
    cursor: "synthwave-sun.svg", cursorHover: "synthwave-triangle.svg",
  },
  {
    name: "Halloween", accent: "#ff7518", bg: "#120a05", mode: "dark",
    font: "'Pirata One', cursive",
    bgImage: "radial-gradient(circle at 70% 15%, rgba(255,180,80,0.35) 0%, transparent 30%), linear-gradient(180deg, #4a1f5c 0%, #6b2f1a 45%, #2a1208 70%, #120a05 100%)",
    cursor: "halloween-pumpkin-unlit.svg", cursorHover: "halloween-pumpkin-lit.svg",
  },
  {
    name: "Christmas", accent: "#e64a50", bg: "#051006", mode: "dark",
    font: "'Paytone One', cursive",
    bgImage: "radial-gradient(circle at 25% 20%, rgba(255,220,150,0.3) 0%, transparent 15%), radial-gradient(circle at 65% 30%, rgba(255,220,150,0.25) 0%, transparent 12%), linear-gradient(180deg, #0a2818 0%, #071c10 50%, #051006 100%)",
    cursor: "christmas-candycane.svg", cursorHover: "christmas-ornament.svg",
  },
  {
    name: "Valentines Day", accent: "#ff4d6d", bg: "#2a0714", mode: "dark",
    font: "'Grandstander', cursive",
    bgImage: "radial-gradient(circle at 50% 20%, rgba(255,77,109,0.3) 0%, transparent 35%), linear-gradient(180deg, #4a1030 0%, #350a22 50%, #2a0714 100%)",
    cursor: "valentines-heart.svg", cursorHover: "valentines-arrow.svg",
  },
  {
    name: "New Years", accent: "#f0c34d", bg: "#05070f", mode: "dark",
    font: "'Josefin Sans', sans-serif",
    bgImage: "radial-gradient(circle at 30% 20%, rgba(240,195,77,0.4) 0%, transparent 15%), radial-gradient(circle at 70% 15%, rgba(240,195,77,0.3) 0%, transparent 12%), radial-gradient(circle at 50% 35%, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px), radial-gradient(circle at 20% 50%, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(180deg, #0a0d1c 0%, #05070f 100%)",
    cursor: null, cursorHover: null,
  },
  {
    name: "Easter", accent: "#c9a0ff", bg: "#22102e", mode: "dark",
    font: "'Quicksand', sans-serif",
    bgImage: "radial-gradient(circle at 30% 15%, rgba(255,255,255,0.3) 0%, transparent 20%), linear-gradient(180deg, #b8e0f0 0%, #d8c8f0 40%, #6b4a8a 70%, #22102e 100%)",
    cursor: "easter-egg.svg", cursorHover: "easter-bunny-ears.svg",
  },
  {
    name: "Summer", accent: "#22c9d6", bg: "#042a2e", mode: "dark",
    font: "'Bubblegum Sans', cursive",
    bgImage: "radial-gradient(circle at 70% 15%, rgba(255,240,180,0.4) 0%, transparent 25%), linear-gradient(180deg, #7fe0e8 0%, #22c9d6 45%, #0a6e73 70%, #042a2e 100%)",
    cursor: "summer-sun.svg", cursorHover: "summer-icecream.svg",
  },
];

function currentAccent() {
  return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT;
}

// Applies every dimension of a theme (or a custom-color partial theme) in
// one shot, so the picker never leaves accent/bg out of sync with
// font/cursor/background the way two separate pickers used to. Shared by
// setTheme() (commits) and previewTheme() (temporary, see below).
function applyThemeValues(theme) {
  localStorage.setItem(ACCENT_KEY, theme.accent);
  localStorage.setItem(BG_KEY, theme.bg);

  const setOrClear = (key, value) => value ? localStorage.setItem(key, value) : localStorage.removeItem(key);
  setOrClear(MODE_KEY, theme.mode === "light" ? "light" : null);
  setOrClear(FONT_KEY, theme.font);
  setOrClear(ZOOM_KEY, theme.zoom);
  setOrClear(BG_IMAGE_KEY, theme.bgImage);
  setOrClear(CURSOR_KEY, theme.cursor);
  setOrClear(CURSOR_HOVER_KEY, theme.cursorHover);

  window.BackbrainTheme.apply();
  window.BackbrainTheme.applyFont();
  window.BackbrainTheme.applyZoom();
  window.BackbrainTheme.applyBackground();
  window.BackbrainCursor.apply();
}

function setTheme(theme) {
  previewSnapshot = null; // committing for real - nothing left to restore
  applyThemeValues(theme);
  renderThemeList();
  renderKeyList();
}

// --- Live theme preview on hover ---
// Hovering a tile applies it (via the same localStorage-driven apply path
// as a real selection) so you can see accent/font/background/cursor
// together before committing, then restores the previous values on
// mouseleave. Snapshotting the real values on first preview and restoring
// them - rather than a separate non-persisting render path - reuses every
// existing apply*() function as-is instead of forking them into "preview"
// and "real" variants.
//
// The preview itself is debounced (HOVER_PREVIEW_DELAY_MS) rather than
// firing on mouseenter - sweeping the mouse across a row of tiles used to
// apply-then-immediately-revert every single tile it crossed, which read as
// the whole page jumping/flickering. Waiting for the cursor to actually
// rest on a tile means a quick scan across the grid changes nothing at all;
// only a deliberate pause previews that tile.
const PREVIEW_KEYS = [ACCENT_KEY, BG_KEY, MODE_KEY, FONT_KEY, ZOOM_KEY, BG_IMAGE_KEY, CURSOR_KEY, CURSOR_HOVER_KEY];
const HOVER_PREVIEW_DELAY_MS = 1000;
let previewSnapshot = null;
let hoverPreviewTimer = null;

function previewTheme(theme) {
  if (!previewSnapshot) previewSnapshot = PREVIEW_KEYS.map(key => [key, localStorage.getItem(key)]);
  applyThemeValues(theme);
}

function scheduleThemePreview(theme) {
  clearTimeout(hoverPreviewTimer);
  hoverPreviewTimer = setTimeout(() => previewTheme(theme), HOVER_PREVIEW_DELAY_MS);
}

function endThemePreview() {
  clearTimeout(hoverPreviewTimer);
  if (!previewSnapshot) return;
  previewSnapshot.forEach(([key, value]) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
  previewSnapshot = null;
  window.BackbrainTheme.apply();
  window.BackbrainTheme.applyFont();
  window.BackbrainTheme.applyZoom();
  window.BackbrainTheme.applyBackground();
  window.BackbrainCursor.apply();
}
// Safety net: a click that commits already clears previewSnapshot itself,
// but if the tab closes/navigates away mid-hover (no guaranteed mouseleave
// in that case), this stops the previewed-but-uncommitted values from
// being left behind in localStorage as if they'd actually been chosen.
window.addEventListener("beforeunload", endThemePreview);

function themeTileHtml(index, isActive) {
  const t = THEMES[index];
  return `
    <button type="button" class="theme-tile${isActive ? " active" : ""}" data-index="${index}" title="${t.name}">
      <span class="theme-tile-swatch" style="background:${t.accent}"></span>
      ${t.cursor
        ? `<span class="theme-tile-cursor" style="background-image: url('${window.BackbrainTheme.resolveAsset(`images/cursors/${t.cursor}`)}')"></span>`
        : `<span class="theme-tile-cursor theme-tile-cursor-default">&#10005;</span>`}
      <span class="theme-tile-name">${t.name}</span>
    </button>
  `;
}

function renderThemeList() {
  const active = currentAccent().toLowerCase();
  const isPreset = THEMES.some(t => t.accent.toLowerCase() === active);
  const activeIndex = THEMES.findIndex(t => t.accent.toLowerCase() === active);
  const restIndexes = THEMES.map((t, i) => i).filter(i => i !== 0);
  const restHasActive = activeIndex !== 0 && activeIndex !== -1;

  const pinnedHtml = `
    <div class="theme-tile-grid theme-tile-grid-pinned">
      ${themeTileHtml(0, activeIndex === 0)}
      <button type="button" class="theme-tile${isPreset ? "" : " active"}" id="customThemeBtn" title="Custom">
        <span class="theme-tile-swatch" style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);"></span>
        <span class="theme-tile-cursor theme-tile-cursor-default">&#10005;</span>
        <span class="theme-tile-name">Custom</span>
      </button>
    </div>
  `;

  const accordionHtml = `
    <div class="theme-accordion">
      <button type="button" class="theme-accordion-toggle${restHasActive ? " open" : ""}" id="allThemesToggle">
        <span>More Themes (${restIndexes.length})</span>
        <i class="fa-solid fa-chevron-down theme-accordion-chevron"></i>
      </button>
      <div class="theme-accordion-content${restHasActive ? " open" : ""}">
        <div class="theme-tile-grid">
          ${restIndexes.map(i => themeTileHtml(i, i === activeIndex)).join("")}
        </div>
      </div>
    </div>
  `;

  themeListEl.innerHTML = pinnedHtml + accordionHtml;

  themeListEl.querySelectorAll(".theme-tile[data-index]").forEach(btn => {
    const theme = THEMES[Number(btn.dataset.index)];
    btn.addEventListener("mouseenter", () => scheduleThemePreview(theme));
    btn.addEventListener("mouseleave", endThemePreview);
    btn.addEventListener("click", () => {
      themeCustomRow.hidden = true;
      setTheme(theme);
    });
  });

  document.getElementById("customThemeBtn").addEventListener("click", () => {
    accentColorInput.value = currentAccent();
    themeCustomRow.hidden = false;
  });

  const accordionToggle = document.getElementById("allThemesToggle");
  accordionToggle.addEventListener("click", () => {
    accordionToggle.classList.toggle("open");
    accordionToggle.nextElementSibling.classList.toggle("open");
  });

  themeCustomRow.hidden = isPreset;
}

accentColorInput.addEventListener("input", () => {
  // No separate background picker for a custom color — a heavily darkened
  // version of the same hue keeps it coherent without adding a second
  // control. Going custom also resets mode/font/background/cursor to off,
  // since a hand-picked color isn't tied to any of the other dimensions a
  // full theme carries.
  const bg = window.BackbrainTheme.darkenHex(accentColorInput.value, 0.15);
  setTheme({ accent: accentColorInput.value, bg, mode: null, font: null, bgImage: null, cursor: null, cursorHover: null });
});

reduceMotionChk.addEventListener("change", () => {
  localStorage.setItem(MOTION_KEY, reduceMotionChk.checked ? "true" : "false");
  window.BackbrainTheme.apply();
});

// If the site is currently showing a preset theme (its accent matches one
// in THEMES exactly), keep every other stored dimension - font, zoom,
// cursor, bgImage, mode - in sync with THEMES' current values rather than
// trusting whatever got snapshotted into localStorage the last time this
// theme happened to be selected. Without this, tuning a shipped theme's
// values in code (e.g. correcting a font size) silently does nothing for
// anyone who already had that theme picked, until they happen to reselect
// it - they'd keep seeing the old value with no way to know it changed.
// A custom color has no matching THEMES entry, so it's left untouched.
function resyncPresetTheme() {
  const active = currentAccent().toLowerCase();
  const theme = THEMES.find(t => t.accent.toLowerCase() === active);
  if (theme) applyThemeValues(theme);
}

function refreshAppearanceControls() {
  resyncPresetTheme();
  renderThemeList();
  reduceMotionChk.checked = localStorage.getItem(MOTION_KEY) === "true";
}

function renderKeyList() {
  const keys = Object.keys(localStorage).sort();
  keyListEl.innerHTML = keys.length
    ? keys.map(key => `
        <div class="settings-key-row">
          <span class="settings-key-label">${friendlyLabel(key)}</span>
          <span class="settings-key-size">${formatBytes((localStorage.getItem(key) || "").length)}</span>
        </div>
      `).join("")
    : `<div class="settings-empty">Nothing stored yet.</div>`;
}

exportBtn.addEventListener("click", () => {
  const data = {};
  Object.keys(localStorage).forEach(key => { data[key] = localStorage.getItem(key); });
  const payload = { exportedAt: new Date().toISOString(), origin: location.origin, data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backbrain-site-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let payload;
    try {
      payload = JSON.parse(e.target.result);
    } catch {
      alert("That file isn't valid JSON.");
      return;
    }
    if (!payload || typeof payload.data !== "object") {
      alert("That doesn't look like a site data export.");
      return;
    }
    const keys = Object.keys(payload.data);
    if (!confirm(`Import ${keys.length} item(s)? This overwrites any of them that already exist here — anything already saved that isn't in the file is left alone.`)) return;
    keys.forEach(key => localStorage.setItem(key, payload.data[key]));
    window.BackbrainTheme.apply();
    window.BackbrainTheme.applyFont();
    window.BackbrainTheme.applyZoom();
    window.BackbrainTheme.applyBackground();
    window.BackbrainCursor.apply();
    window.BackbrainStealth.applyCloak();
    refreshAppearanceControls();
    refreshStealthControls();
    renderKeyList();
    alert("Import complete.");
  };
  reader.readAsText(file);
  importInput.value = "";
});

clearBtn.addEventListener("click", () => {
  if (!confirm("This permanently deletes ALL locally saved data for this entire site — chat login, sprite art, bookmarks, everything. This cannot be undone. Continue?")) return;
  localStorage.clear();
  window.BackbrainTheme.apply();
  window.BackbrainTheme.applyFont();
  window.BackbrainTheme.applyZoom();
  window.BackbrainTheme.applyBackground();
  window.BackbrainCursor.apply();
  refreshAppearanceControls();
  renderKeyList();
});

function renderShortcutsList() {
  const listEl = document.getElementById("settingsShortcutsList");
  // Reuses sidebar.js's own SHORTCUTS array (window.BackbrainTheme.shortcuts)
  // rather than a second hand-kept copy - same list the "?" overlay shows.
  listEl.innerHTML = window.BackbrainTheme.shortcuts.map(s => `
    <div class="shortcuts-row">
      <span class="shortcuts-desc">${s.desc}</span>
      <kbd>${s.keys}</kbd>
    </div>
  `).join("");
}

// --- Privacy & Stealth: tab cloak + panic key ---
// The actual behavior (applying a cloak, listening for the panic key) lives in
// sidebar.js and is exposed as window.BackbrainStealth; this section is just
// the Settings UI that reads/writes the same localStorage keys and calls
// applyCloak() so changes preview live without a reload.
const CLOAK_KEY = "site_tab_cloak";
const PANIC_ENABLED_KEY = "site_panic_enabled";
const PANIC_KEY_KEY = "site_panic_key";
const PANIC_URL_KEY = "site_panic_url";

// Deliberately excludes Escape (it already closes the search overlay) and any
// plain letter/number (far too easy to trigger mid-type) - only keys that are
// rarely pressed by accident during normal browsing.
const PANIC_KEYS = [
  { value: "`", label: "` (backtick)" },
  { value: "\\", label: "\\ (backslash)" },
  { value: "End", label: "End" },
  { value: "Insert", label: "Insert" },
  { value: "Pause", label: "Pause / Break" },
];

const cloakPresetEl = document.getElementById("cloakPreset");
const cloakCustomRow = document.getElementById("cloakCustomRow");
const cloakCustomTitle = document.getElementById("cloakCustomTitle");
const panicEnabledChk = document.getElementById("panicEnabledChk");
const panicControls = document.getElementById("panicControls");
const panicKeySelect = document.getElementById("panicKeySelect");
const panicUrlInput = document.getElementById("panicUrlInput");
const panicTestBtn = document.getElementById("panicTestBtn");

function getCloakCfg() {
  try { return JSON.parse(localStorage.getItem(CLOAK_KEY)); } catch { return null; }
}

function buildCloakOptions() {
  const presets = window.BackbrainStealth.CLOAK_PRESETS;
  const opts = ['<option value="off">Off — show the real title &amp; icon</option>'];
  Object.entries(presets).forEach(([id, p]) => opts.push(`<option value="${id}">${p.label}</option>`));
  opts.push('<option value="custom">Custom title…</option>');
  cloakPresetEl.innerHTML = opts.join("");
}

function buildPanicKeyOptions() {
  panicKeySelect.innerHTML = PANIC_KEYS.map(k => `<option value="${k.value}">${k.label}</option>`).join("");
}

function refreshStealthControls() {
  const cfg = getCloakCfg();
  const preset = (cfg && cfg.preset) || "off";
  cloakPresetEl.value = preset;
  cloakCustomRow.hidden = preset !== "custom";
  cloakCustomTitle.value = preset === "custom" ? (cfg.title || "") : "";

  panicEnabledChk.checked = localStorage.getItem(PANIC_ENABLED_KEY) === "true";
  panicKeySelect.value = localStorage.getItem(PANIC_KEY_KEY) || window.BackbrainStealth.DEFAULT_PANIC_KEY;
  if (!panicKeySelect.value) panicKeySelect.value = window.BackbrainStealth.DEFAULT_PANIC_KEY;
  panicUrlInput.value = localStorage.getItem(PANIC_URL_KEY) || window.BackbrainStealth.DEFAULT_PANIC_URL;
  panicControls.classList.toggle("disabled", !panicEnabledChk.checked);
}

cloakPresetEl.addEventListener("change", () => {
  const val = cloakPresetEl.value;
  if (val === "off") localStorage.removeItem(CLOAK_KEY);
  else if (val === "custom") localStorage.setItem(CLOAK_KEY, JSON.stringify({ preset: "custom", title: cloakCustomTitle.value.trim() }));
  else localStorage.setItem(CLOAK_KEY, JSON.stringify({ preset: val }));
  cloakCustomRow.hidden = val !== "custom";
  window.BackbrainStealth.applyCloak();
  renderKeyList();
});

cloakCustomTitle.addEventListener("input", () => {
  localStorage.setItem(CLOAK_KEY, JSON.stringify({ preset: "custom", title: cloakCustomTitle.value.trim() }));
  window.BackbrainStealth.applyCloak();
});

panicEnabledChk.addEventListener("change", () => {
  localStorage.setItem(PANIC_ENABLED_KEY, panicEnabledChk.checked ? "true" : "false");
  // Persist the currently-shown key/URL too, so enabling takes effect
  // immediately with exactly what's on screen (not last-saved values).
  localStorage.setItem(PANIC_KEY_KEY, panicKeySelect.value);
  const url = panicUrlInput.value.trim();
  if (url) localStorage.setItem(PANIC_URL_KEY, url);
  panicControls.classList.toggle("disabled", !panicEnabledChk.checked);
  renderKeyList();
});

panicKeySelect.addEventListener("change", () => {
  localStorage.setItem(PANIC_KEY_KEY, panicKeySelect.value);
});

panicUrlInput.addEventListener("change", () => {
  const url = panicUrlInput.value.trim();
  if (url) localStorage.setItem(PANIC_URL_KEY, url);
  else localStorage.removeItem(PANIC_URL_KEY);
});

// Opens the destination in a new tab so you can confirm the URL works without
// navigating away from Settings (the real panic key uses location.replace).
panicTestBtn.addEventListener("click", () => {
  window.open(panicUrlInput.value.trim() || window.BackbrainStealth.DEFAULT_PANIC_URL, "_blank", "noopener");
});

buildCloakOptions();
buildPanicKeyOptions();

refreshAppearanceControls();
refreshStealthControls();
renderKeyList();
renderShortcutsList();
