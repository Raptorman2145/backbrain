(function () {
  // --- Site-wide appearance (accent color + reduce motion) ---
  // Applied as the very first thing this script does, before building the
  // sidebar itself, to minimize the flash of default styling before it
  // kicks in. Exposed on window so the Settings page can reapply it live
  // without duplicating this logic.
  const THEME_ACCENT_KEY = "site_theme_accent";
  const THEME_BG_KEY = "site_theme_bg";
  const THEME_MODE_KEY = "site_theme_mode";
  const THEME_FONT_KEY = "site_theme_font";
  const THEME_BG_IMAGE_KEY = "site_theme_bg_image";
  const THEME_MOTION_KEY = "site_reduce_motion";
  const CURSOR_KEY = "site_cursor";
  const CURSOR_HOVER_KEY = "site_cursor_hover";

  // Pages that include this script live at different folder depths (site
  // root, Tabs/, Tabs/Tool Tabs/, ...), so a single relative href can't work
  // from all of them. General Code/ is always a child of code/, which is
  // always a direct child of the site root, so resolving "../../" against
  // this script's own (always-absolute) src gives a stable root to resolve
  // every link (and every themed asset, like cursor images) against,
  // regardless of where the including page sits. Declared up here, before
  // it's needed by applySiteCursor() below, rather than down with the
  // sidebar-link building code it was originally written for.
  const siteRoot = new URL("../../", document.currentScript.src);

  function darkenHex(hex, factor) {
    const n = parseInt(hex.replace("#", ""), 16);
    const clamp = c => Math.max(0, Math.min(255, Math.round(c)));
    const r = clamp(((n >> 16) & 255) * factor);
    const g = clamp(((n >> 8) & 255) * factor);
    const b = clamp((n & 255) * factor);
    return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
  }

  function lightenHex(hex, factor) {
    const n = parseInt(hex.replace("#", ""), 16);
    const clamp = c => Math.max(0, Math.min(255, Math.round(c)));
    const mix = c => clamp(c + (255 - c) * factor);
    const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
    return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
  }

  function hexToRgba(hex, alpha) {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  // Picks whichever of near-black or white reads better on top of the given
  // color (WCAG relative luminance contrast), instead of always assuming
  // white text works - it doesn't for the lighter/brighter accent colors
  // (yellows, cyans, limes), where white-on-accent contrast can drop below
  // 2:1. Used for --accent-text, which every solid accent-colored button
  // across the site (games, settings, 404, team modal) renders its label in.
  function relativeLuminance(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    const channel = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const r = channel((n >> 16) & 255), g = channel((n >> 8) & 255), b = channel(n & 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(hexA, hexB) {
    const lA = relativeLuminance(hexA), lB = relativeLuminance(hexB);
    const lighter = Math.max(lA, lB), darker = Math.min(lA, lB);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function getReadableText(hex) {
    const nearBlack = "#0b0b0f";
    return contrastRatio("#ffffff", hex) >= contrastRatio(nearBlack, hex) ? "#ffffff" : nearBlack;
  }

  // A theme is an {accent, bg} pair, not just one color — recoloring only
  // the accent left the background and hover states stuck on the default
  // red no matter what was picked. Both get applied via inline style on
  // <html>, which wins over every page's own :root rules (even the ones
  // that hardcode a local --bg override), no per-page changes needed.
  //
  // The homepage HUD (index.html) and a couple of other widgets define
  // their own bespoke color variables instead of the shared tokens below
  // (--primary-red, --glow-bright, --bg-dark) — those get mirrored from
  // the same theme too so the whole site actually moves together. Setting
  // a custom property a given page never references is harmless, so this
  // applies unconditionally rather than checking which page we're on.
  function applySiteTheme() {
    const accent = localStorage.getItem(THEME_ACCENT_KEY);
    const bg = localStorage.getItem(THEME_BG_KEY);
    const root = document.documentElement.style;

    if (accent) {
      root.setProperty("--accent-bg", accent);
      root.setProperty("--accent-dark", darkenHex(accent, 0.45));
      root.setProperty("--accent-text", getReadableText(accent));
      root.setProperty("--surface", hexToRgba(accent, 0.10));
      root.setProperty("--surface-alt", hexToRgba(accent, 0.07));
      root.setProperty("--card-bg", hexToRgba(accent, 0.10));
      root.setProperty("--primary-red", darkenHex(accent, 0.55));
      root.setProperty("--glow-bright", lightenHex(accent, 0.25));
    } else {
      ["--accent-bg", "--accent-dark", "--accent-text", "--surface", "--surface-alt", "--card-bg", "--primary-red", "--glow-bright"]
        .forEach(prop => root.removeProperty(prop));
    }

    if (bg) {
      root.setProperty("--bg", bg);
      root.setProperty("--bg-dark", hexToRgba(bg, 0.98));
    } else {
      root.removeProperty("--bg");
      root.removeProperty("--bg-dark");
    }

    // Every theme but Wii is dark-mode (white text on a dark bg), which is
    // what shared.css's :root already hardcodes - so dark mode needs no
    // overrides here, just like accent/bg above when nothing's picked yet.
    // Light mode only needs to flip the tokens that assume a dark backdrop
    // (text, borders, the loading skeleton shimmer, the keyboard focus
    // ring) - --surface/--surface-alt/--card-bg stay accent-tinted from the
    // block above either way, since a pale accent-tinted card on a white
    // page reads fine too (that's genuinely how Wii's own channels look).
    if (localStorage.getItem(THEME_MODE_KEY) === "light") {
      root.setProperty("--text", "#14181c");
      root.setProperty("--text-muted", "rgba(20, 24, 28, 0.65)");
      root.setProperty("--border", "rgba(20, 24, 28, 0.15)");
      root.setProperty("--border-strong", "rgba(20, 24, 28, 0.32)");
      root.setProperty("--skeleton-a", "rgba(20, 24, 28, 0.05)");
      root.setProperty("--skeleton-b", "rgba(20, 24, 28, 0.12)");
      root.setProperty("--focus-ring", "0 0 0 3px rgba(20, 24, 28, 0.35)");
      root.setProperty("color-scheme", "light");
    } else {
      ["--text", "--text-muted", "--border", "--border-strong", "--skeleton-a", "--skeleton-b", "--focus-ring", "color-scheme"]
        .forEach(prop => root.removeProperty(prop));
    }

    document.body.classList.toggle("reduce-motion", localStorage.getItem(THEME_MOTION_KEY) === "true");
  }

  // --- Site-wide theme font ---
  // None of these are the real licensed/extracted game fonts (Wii's font,
  // Undertale's "Determination", Minecraft's "Mojangles", Discord's "gg
  // sans" are all proprietary or fan-extracted, not freely redistributable)
  // - these are close, properly open-licensed Google Fonts stand-ins.
  //
  // Only the ONE family the active theme actually needs gets requested, not
  // all of them - this used to load a single combined URL covering every
  // theme font on every single page view regardless of which theme (if
  // any) was active, which meant loading fonts for themes a visitor had
  // never even picked in Settings. Keyed by the bare family
  // name so it can be pulled out of the CSS-ready font stack strings stored
  // per theme (e.g. "'Varela Round', sans-serif" -> "Varela Round").
  const FONT_GOOGLE_PARAMS = {
    "Varela Round": "family=Varela+Round",
    "Silkscreen": "family=Silkscreen:wght@400;700",
    "Cinzel": "family=Cinzel:wght@400;600;700",
    "Press Start 2P": "family=Press+Start+2P",
    "VT323": "family=VT323",
    "Poppins": "family=Poppins:wght@400;600;700",
    "Rubik": "family=Rubik:wght@400;500;700",
    "Baloo 2": "family=Baloo+2:wght@400;600;700",
    "Orbitron": "family=Orbitron:wght@400;700;900",
    "Fredoka": "family=Fredoka:wght@400;600",
    "Bungee": "family=Bungee",
    "Black Ops One": "family=Black+Ops+One",
    "Audiowide": "family=Audiowide",
    "Pirata One": "family=Pirata+One",
    "Paytone One": "family=Paytone+One",
    "Grandstander": "family=Grandstander:wght@400;700",
    "Josefin Sans": "family=Josefin+Sans:wght@400;600;700",
    "Quicksand": "family=Quicksand:wght@400;600;700",
    "Bubblegum Sans": "family=Bubblegum+Sans",
  };

  function loadGoogleFontFor(fontStack) {
    const familyName = fontStack && (fontStack.match(/^'([^']+)'/) || [])[1];
    const param = familyName && FONT_GOOGLE_PARAMS[familyName];
    if (!param) return;
    const url = `https://fonts.googleapis.com/css2?${param}&display=swap`;
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }

  // Set directly on <body> (not as a --custom-property) because most pages
  // hardcode their own `body { font-family: ... }` in their page-specific
  // CSS, loaded after shared.css - a custom property on <html> would lose
  // that cascade fight. An inline style on the exact element the page's own
  // rule targets wins regardless of load order, no !important needed.
  function applySiteFont() {
    const font = localStorage.getItem(THEME_FONT_KEY);
    document.body.style.fontFamily = font || "";
    loadGoogleFontFor(font);
  }

  // --- Site-wide theme background scene ---
  // Some scenes are hand-built CSS gradients, others are real photos (with a
  // dark scrim gradient layered over them for text contrast) - see THEMES in
  // settings.js for the values. Either way, the scene is painted on a
  // dedicated ::before layer (shared.css) pinned behind all real content via
  // z-index, NOT directly on body - body's own CSS already sets
  // `background: var(--bg)` (a shorthand that would reset an inline
  // background-image right back to none), and more importantly, the ::before
  // layer is what lets shared.css blur just the scene (a plain photo looks
  // sharp and busy behind text) without the filter also blurring body's
  // actual content, since CSS filter blurs an element and everything inside
  // it - putting the image on body directly would blur the whole page.
  // Passed through as a CSS custom property since inline styles can target
  // a real element but not a pseudo-element directly.
  function applySiteBackground() {
    const image = localStorage.getItem(THEME_BG_IMAGE_KEY);
    document.documentElement.style.setProperty("--site-bg-image", image ? image : "none");
  }

  // --- Site-wide custom cursor (idle + hover pair) ---
  // Each theme's cursor is two SVGs: an idle one for the general page and a
  // hover one for anything clickable. Inline style on <html> can express the
  // idle state fine, but :hover needs a real CSS rule - inline styles can't
  // do pseudo-classes - so this injects a tiny <style> block instead. The
  // hover selector list covers the site's actual clickable elements (every
  // button/link across every page is a real <a>/<button>, not a div with a
  // bespoke click handler) rather than trying to chase down every custom
  // class that sets cursor: pointer somewhere.
  //
  // That injected rule needs !important: almost everything clickable on
  // this site already has its own class with an explicit `cursor: pointer`
  // (.sidebar-link, .settings-btn, .bigButton, .game-card, ...), and a
  // class selector (0-1-0) beats a plain element-selector list like
  // `a, button` (0-0-1) regardless of load order. Without !important the
  // hover cursor silently loses that fight on literally every real button
  // and link site-wide - which is exactly what happened before this line
  // existed. The idle cursor doesn't need it since inline style on <html>
  // already wins on its own.
  //
  // The hotspot (the exact pixel that acts as the click point) defaults to
  // dead center, which is correct for every blob/badge-style cursor here
  // (snowflake, bolt, ring, etc). The finger/arrow-tip cursors are the
  // exception - their natural click point is at the tip, not the middle.
  const CURSOR_HOTSPOTS = {
    "windows.svg": "4 2",
    "windows-pointer.svg": "4 2",
    "wii-cursor.svg": "13 3",
  };
  const CURSOR_HOVER_SELECTOR = 'a, button, select, summary, label[for], input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';

  function cursorRule(file, fallback) {
    const url = new URL(`images/cursors/${file}`, siteRoot).href;
    const hotspot = CURSOR_HOTSPOTS[file] || "16 16";
    return `url("${url}") ${hotspot}, ${fallback}`;
  }

  function applySiteCursor() {
    const idleFile = localStorage.getItem(CURSOR_KEY);
    const hoverFile = localStorage.getItem(CURSOR_HOVER_KEY);
    let styleEl = document.getElementById("backbrain-cursor-style");

    if (!idleFile) {
      if (styleEl) styleEl.textContent = "";
      document.documentElement.style.cursor = "";
      return;
    }

    document.documentElement.style.cursor = cursorRule(idleFile, "auto");

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "backbrain-cursor-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = hoverFile
      ? `${CURSOR_HOVER_SELECTOR} { cursor: ${cursorRule(hoverFile, "pointer")} !important; }`
      : "";
  }

  // --- Shared Firebase helper ---
  // Chat, the "What's Next?" poll, and Whiteboard sharing all optionally
  // talk to the same Firebase project (whatever the group already
  // configured for Chat, reused via chat_firebase_config). Only Chat
  // requires Firebase outright and loads its SDK eagerly on its own page -
  // for the poll and Whiteboard it's a bonus feature most visitors never
  // touch, so the ~100KB SDK download only happens if a config actually
  // exists AND that page decides to use it, not on every page view.
  // loadFirebaseSdk() is idempotent (safe to call more than once - the
  // second call reuses the same in-flight/completed promise) and loads the
  // two compat scripts in the order the Firebase SDK requires them.
  const FIREBASE_CONFIG_KEY = "chat_firebase_config";
  const FIREBASE_SDK_VERSION = "10.7.1";
  let firebaseSdkPromise = null;

  function getFirebaseConfig() {
    try {
      return JSON.parse(localStorage.getItem(FIREBASE_CONFIG_KEY));
    } catch {
      return null;
    }
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function loadFirebaseSdk() {
    if (!firebaseSdkPromise) {
      const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/`;
      firebaseSdkPromise = loadScriptOnce(base + "firebase-app-compat.js")
        .then(() => loadScriptOnce(base + "firebase-database-compat.js"));
    }
    return firebaseSdkPromise;
  }

  function initFirebaseOnce(config) {
    if (!firebase.apps.length) firebase.initializeApp(config);
    return firebase.database();
  }

  applySiteTheme();
  applySiteFont();
  applySiteBackground();
  applySiteCursor();
  window.BackbrainFirebase = { getConfig: getFirebaseConfig, loadSdk: loadFirebaseSdk, init: initFirebaseOnce };
  window.BackbrainTheme = {
    apply: applySiteTheme,
    applyFont: applySiteFont,
    applyBackground: applySiteBackground,
    darkenHex, lightenHex, hexToRgba, getReadableText,
    // Resolves a site-root-relative path (e.g. "images/cursors/frost.svg")
    // to an absolute URL, reusing the same siteRoot every other resolution
    // in this file already depends on. Exposed so other scripts (settings.js
    // building cursor preview swatches, team.js/games.js resolving avatar or
    // card images) don't each need their own copy of the depth-independent
    // resolution trick - one already-correct implementation, not several.
    resolveAsset: path => new URL(path, siteRoot).href,
  };
  window.BackbrainCursor = { apply: applySiteCursor };

  // Hrefs below are paths relative to the site root.
  // Games.html is deliberately unlinked from every nav surface here (main
  // sidebar, search index, deep-links) - it's unused for now, per request.
  // The page and its code are untouched, just not reachable through normal
  // site navigation; re-add a Games entry here to bring it back.
  const linksBeforeAccordion = [
    { href: "Tabs/Tool%20Tabs/MOVIES.html", icon: "fa-solid fa-clapperboard", label: "Movies" },
    { href: "Tabs/Tool%20Tabs/PROXY.html", icon: "fa-solid fa-magnifying-glass", label: "Proxy" },
  ];
  // Music and Fern are still real placeholder tabs (blank iframe until a
  // real site gets embedded); Site 4 and Site 5 were the same pattern with
  // nothing planned for them and got removed outright, not just unlinked -
  // UGS and gn-math moved in here from linksAfterAccordion to fill the spot.
  const accordionLinks = [
    { href: "Tabs/Tool%20Tabs/Music.html", icon: "fa-solid fa-music", label: "Music" },
    { href: "Tabs/Tool%20Tabs/Fern.html", icon: "fa-solid fa-globe", label: "Fern" },
    { href: "Tabs/Tool%20Tabs/UGS.html", icon: "fa-solid fa-box-archive", label: "UGS" },
    { href: "Tabs/Tool%20Tabs/GNMATH.html", icon: "fa-solid fa-square-root-variable", label: "gn-math" },
    { href: "Tabs/Tool%20Tabs/TRUFFLED.html", icon: "fa-solid fa-globe", label: "Truffled" },
  ];
  const linksAfterAccordion = [
    { href: "Tabs/Tool%20Tabs/tools.html", icon: "fa-solid fa-toolbox", label: "Tools" },
  ];
  const secondaryLinks = [
    { href: "Tabs/team.html", icon: "fa-solid fa-people-group", label: "Team" },
    { href: "Tabs/credits.html", icon: "fa-solid fa-scroll", label: "Credits" },
    { href: "Tabs/changelog.html", icon: "fa-solid fa-clock-rotate-left", label: "Changelog" },
    { href: "Tabs/Tool%20Tabs/CHAT.html", icon: "fa-brands fa-discord", label: "Discord" },
    { href: "Tabs/settings.html", icon: "fa-solid fa-gear", label: "Settings" },
  ];

  // Every real page on the site, for the Ctrl+K search. Kept as one flat
  // list (not derived from the link arrays above) since it also needs to
  // cover pages that only live on tools.html, not in the sidebar itself.
  // "category" is unused now that the homepage directory that grouped by it
  // has been removed - left on each entry in case a similar grouping comes
  // back rather than stripping every entry for a field that costs nothing.
  const SEARCH_INDEX = [
    { title: "Home", href: "index.html", icon: "fa-solid fa-house", category: null },
    { title: "Movies", href: "Tabs/Tool%20Tabs/MOVIES.html", icon: "fa-solid fa-clapperboard", category: "Entertainment" },
    { title: "Discord", href: "Tabs/Tool%20Tabs/CHAT.html", icon: "fa-brands fa-discord", category: "Entertainment" },
    { title: "Proxy", href: "Tabs/Tool%20Tabs/PROXY.html", icon: "fa-solid fa-magnifying-glass", category: "Entertainment" },
    { title: "Music", href: "Tabs/Tool%20Tabs/Music.html", icon: "fa-solid fa-music", category: "Entertainment" },
    { title: "Fern", href: "Tabs/Tool%20Tabs/Fern.html", icon: "fa-solid fa-globe", category: "Entertainment" },
    { title: "Truffled", href: "Tabs/Tool%20Tabs/TRUFFLED.html", icon: "fa-solid fa-globe", category: "Entertainment" },
    { title: "Tools", href: "Tabs/Tool%20Tabs/tools.html", icon: "fa-solid fa-toolbox", category: "Tools" },
    { title: "HTML Viewer", href: "Tabs/Tool%20Tabs/HTMLVIEWER.html", icon: "fa-solid fa-code", category: "Tools" },
    { title: "Youtube Unblocker", href: "Tabs/Tool%20Tabs/YOUTUBEUNBLOCKER.html", icon: "fa-brands fa-youtube", category: "Tools" },
    { title: "Unit Converter", href: "Tabs/Tool%20Tabs/UNITCONVERTER.html", icon: "fa-solid fa-ruler-combined", category: "Tools" },
    { title: "Color Picker", href: "Tabs/Tool%20Tabs/COLORPICKER.html", icon: "fa-solid fa-palette", category: "Tools" },
    { title: "QR Code Generator", href: "Tabs/Tool%20Tabs/QRCODE.html", icon: "fa-solid fa-qrcode", category: "Tools" },
    { title: "Cipher Decoder", href: "Tabs/Tool%20Tabs/CIPHERDECODER.html", icon: "fa-solid fa-key", category: "Tools" },
    { title: "gn-math", href: "Tabs/Tool%20Tabs/GNMATH.html", icon: "fa-solid fa-square-root-variable", category: "Tools" },
    { title: "UGS", href: "Tabs/Tool%20Tabs/UGS.html", icon: "fa-solid fa-box-archive", category: "Tools" },
    { title: "Dice Roller", href: "Tabs/Tool%20Tabs/DICEROLLER.html", icon: "fa-solid fa-dice", category: "Fun & Games" },
    { title: "Tier List", href: "Tabs/Tool%20Tabs/TIERLIST.html", icon: "fa-solid fa-ranking-star", category: "Fun & Games" },
    { title: "Sprite Maker", href: "Tabs/Tool%20Tabs/SPRITEMAKER.html", icon: "fa-solid fa-brush", category: "Fun & Games" },
    { title: "Wheel Spinner", href: "Tabs/Tool%20Tabs/WHEELSPINNER.html", icon: "fa-solid fa-compact-disc", category: "Fun & Games" },
    { title: "Whiteboard", href: "Tabs/Tool%20Tabs/WHITEBOARD.html", icon: "fa-solid fa-chalkboard", category: "Fun & Games" },
    { title: "What's Next?", href: "Tabs/Tool%20Tabs/ADDNEXT.html", icon: "fa-solid fa-square-poll-vertical", category: "Fun & Games" },
    { title: "Timer", href: "Tabs/Tool%20Tabs/TIMER.html", icon: "fa-solid fa-stopwatch", category: "Fun & Games" },
    { title: "Magic 8-Ball", href: "Tabs/Tool%20Tabs/8BALL.html", icon: "fa-solid fa-circle-question", category: "Fun & Games" },
    { title: "Team", href: "Tabs/team.html", icon: "fa-solid fa-people-group", category: "About" },
    { title: "Credits", href: "Tabs/credits.html", icon: "fa-solid fa-scroll", category: "About" },
    { title: "Changelog", href: "Tabs/changelog.html", icon: "fa-solid fa-clock-rotate-left", category: "About" },
    { title: "Settings", href: "Tabs/settings.html", icon: "fa-solid fa-gear", category: "About" },
  ];
  // window.BackbrainTheme already exists (built above, before this array
  // existed) - adding to it here rather than exposing a whole separate
  // global just for this one array.
  window.BackbrainTheme.searchIndex = SEARCH_INDEX;
  window.BackbrainTheme.resolveHref = href => resolveHref(href);
  // Shared with the tracking further down (see currentPage) - one key, not
  // two copies of the same string to keep in sync.
  const TOOL_USAGE_KEY = "tool_usage_counts";
  // Reads back what that tracking has recorded - index.html uses this for
  // its "most used" hero-stats line. Returns SEARCH_INDEX entries
  // (title/icon/href), not raw counts, since that's all any caller
  // actually needs to render a list.
  window.BackbrainTheme.mostUsedTools = (limit = 3) => {
    let usageCounts;
    try { usageCounts = JSON.parse(localStorage.getItem(TOOL_USAGE_KEY)) || {}; } catch { usageCounts = {}; }
    return Object.entries(usageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([href]) => SEARCH_INDEX.find(item => item.href === href))
      .filter(Boolean);
  };

  // Sub-page content — kept in sync by hand with General Code/team.js since
  // there's no shared data source between them. Each jumps straight to that
  // member via the hash deep-link team.html already supports (opens their
  // profile popup). The equivalent per-game entries (Game Code/games.js)
  // are intentionally left out while Games.html is unlinked - see the note
  // by linksBeforeAccordion above.
  const CONTENT_INDEX = [
    { title: "Raptor", context: "Team", href: "Tabs/team.html#member-Raptor", icon: "fa-solid fa-people-group" },
    { title: "Karl", context: "Team", href: "Tabs/team.html#member-Karl", icon: "fa-solid fa-people-group" },
    { title: "I_AM_COMPUTER", context: "Team", href: "Tabs/team.html#member-I_AM_COMPUTER", icon: "fa-solid fa-people-group" },
    { title: "Rice", context: "Team", href: "Tabs/team.html#member-Rice", icon: "fa-solid fa-people-group" },
    { title: "Sherma", context: "Team", href: "Tabs/team.html#member-Sherma", icon: "fa-solid fa-people-group" },
    { title: "Cobalt", context: "Team", href: "Tabs/team.html#member-Cobalt", icon: "fa-solid fa-people-group" },
    { title: "Shadow", context: "Team", href: "Tabs/team.html#member-Shadow", icon: "fa-solid fa-people-group" },
    { title: "IGotGassed", context: "Team", href: "Tabs/team.html#member-IGotGassed", icon: "fa-solid fa-people-group" },
    { title: "HOBO", context: "Team", href: "Tabs/team.html#member-HOBO", icon: "fa-solid fa-people-group" },
  ];

  const FULL_INDEX = [...SEARCH_INDEX, ...CONTENT_INDEX];

  const currentPage = location.pathname.split("/").pop();

  // --- Tool usage tracking ---
  // Counts a visit only for real tools (Tools + Fun & Games categories),
  // not every page site-wide - so this doesn't just reflect how often
  // someone opens Settings or Credits. Keyed by href (SEARCH_INDEX's
  // stable identity for a page) rather than title, same match technique
  // renderLink() below already uses for active-link highlighting.
  const visitedTool = SEARCH_INDEX.find(item =>
    (item.category === "Tools" || item.category === "Fun & Games") && item.href.split("/").pop() === currentPage
  );
  if (visitedTool) {
    let usageCounts;
    try { usageCounts = JSON.parse(localStorage.getItem(TOOL_USAGE_KEY)) || {}; } catch { usageCounts = {}; }
    usageCounts[visitedTool.href] = (usageCounts[visitedTool.href] || 0) + 1;
    localStorage.setItem(TOOL_USAGE_KEY, JSON.stringify(usageCounts));
  }

  function resolveHref(href) {
    return href === "#" ? "#" : new URL(href, siteRoot).href;
  }

  function renderLink(link, extraClass) {
    const isActive = link.href !== "#" && link.href.split("/").pop() === currentPage;
    const classes = ["sidebar-link", extraClass, isActive ? "active" : ""].filter(Boolean).join(" ");
    return `<a class="${classes}" href="${resolveHref(link.href)}"${isActive ? ' aria-current="page"' : ""}><i class="${link.icon}"></i><span>${link.label}</span></a>`;
  }

  const accordionHasActive = accordionLinks.some(link => link.href.split("/").pop() === currentPage);

  const zone = document.createElement("div");
  zone.className = "sidebar-zone";
  const logoUrl = new URL("images/logo.png", siteRoot).href;

  zone.innerHTML = `
    <div class="sidebar-panel">
      <a class="sidebar-logo" href="${resolveHref('index.html')}" title="Home">
        <img src="${logoUrl}" alt="The Gamer's Backbrain" width="995" height="620">
      </a>
      <button type="button" class="sidebar-search-btn" id="sidebarSearchBtn">
        <i class="fa-solid fa-magnifying-glass"></i><span>Search</span><kbd>Ctrl K</kbd>
      </button>
      ${linksBeforeAccordion.map(link => renderLink(link)).join("")}
      <div class="sidebar-accordion">
        <button type="button" class="sidebar-link sidebar-accordion-toggle${accordionHasActive ? " open" : ""}" id="sidebarAccordionToggle">
          <i class="fa-solid fa-layer-group"></i><span>More Sites</span>
          <i class="fa-solid fa-chevron-down sidebar-accordion-chevron"></i>
        </button>
        <div class="sidebar-accordion-content${accordionHasActive ? " open" : ""}" id="sidebarAccordionContent">
          ${accordionLinks.map(link => renderLink(link, "sidebar-link-subtle")).join("")}
        </div>
      </div>
      ${linksAfterAccordion.map(link => renderLink(link)).join("")}
      <div class="sidebar-secondary">
        ${secondaryLinks.map(link => renderLink(link, "sidebar-link-subtle")).join("")}
      </div>
      <span class="sidebar-chevron">»</span>
    </div>
  `;

  document.body.prepend(zone);

  const accordionToggle = zone.querySelector("#sidebarAccordionToggle");
  const accordionContent = zone.querySelector("#sidebarAccordionContent");
  accordionToggle.addEventListener("click", () => {
    accordionToggle.classList.toggle("open");
    accordionContent.classList.toggle("open");
  });

  // --- Unread changelog badge ---
  // "Seen" is recorded by changelog.js itself, only when someone's actually
  // on changelog.html (see the comment there) - this just loads that same
  // file to read CHANGELOG[0].date and compare. Loading it a second time on
  // changelog.html itself (which already includes its own copy) is harmless
  // - same data, an idempotent re-render, not worth guarding against.
  const changelogLink = zone.querySelector('a[href$="changelog.html"]');
  if (changelogLink) {
    const badge = document.createElement("span");
    badge.className = "sidebar-link-badge";
    badge.hidden = true;
    changelogLink.appendChild(badge);

    const script = document.createElement("script");
    script.src = new URL("code/General%20Code/changelog.js", siteRoot).href;
    script.onload = () => {
      const entries = window.CHANGELOG;
      if (!entries || !entries.length) return;
      const latest = entries[0].date;
      const seen = localStorage.getItem("site_changelog_seen");
      // No record yet = first-ever visit - nothing to "catch up" on, so
      // just start tracking from here instead of lighting up immediately.
      if (seen === null) localStorage.setItem("site_changelog_seen", latest);
      else badge.hidden = !(latest > seen);
    };
    document.head.appendChild(script);
  }

  // Random Page button removed for now - was here, picking from
  // SEARCH_INDEX and navigating via resolveHref(). Re-add the button markup
  // next to #sidebarSearchBtn above and this handler to bring it back.

  // --- Site-wide search (Ctrl+K) ---
  const searchOverlay = document.createElement("div");
  searchOverlay.className = "site-search-overlay";
  searchOverlay.hidden = true;
  searchOverlay.innerHTML = `
    <div class="site-search-box">
      <input type="text" id="siteSearchInput" placeholder="Search the site..." autocomplete="off">
      <div class="site-search-results" id="siteSearchResults"></div>
    </div>
  `;
  document.body.appendChild(searchOverlay);

  const searchInput = searchOverlay.querySelector("#siteSearchInput");
  const searchResultsEl = searchOverlay.querySelector("#siteSearchResults");
  let currentResults = [];
  let activeResultIndex = -1;

  // Subsequence match: every character of q appears in title in order, not
  // necessarily contiguous (so "utube" still finds "Youtube Unblocker", and
  // a missed/extra letter like "youtub unblocker" still finds "Youtube
  // Unblocker"). Returns null on no match, otherwise a score where lower is
  // better - span-length (tight clusters of matched letters score better
  // than ones scattered across the whole title) plus a small tie-breaker
  // toward matches starting earlier in the title.
  function fuzzyScore(title, q) {
    let searchFrom = 0, first = -1, last = -1;
    for (let i = 0; i < q.length; i++) {
      const idx = title.indexOf(q[i], searchFrom);
      if (idx === -1) return null;
      if (first === -1) first = idx;
      last = idx;
      searchFrom = idx + 1;
    }
    return (last - first) + first * 0.1;
  }

  function filterIndex(query) {
    const q = query.trim().toLowerCase();
    // Empty query: just show the top-level pages, not every game/team member too.
    if (!q) return SEARCH_INDEX;
    const starts = [], contains = [], fuzzy = [];
    FULL_INDEX.forEach(item => {
      const title = item.title.toLowerCase();
      if (title.startsWith(q)) { starts.push(item); return; }
      if (title.includes(q)) { contains.push(item); return; }
      const score = fuzzyScore(title, q);
      if (score !== null) fuzzy.push({ item, score });
    });
    fuzzy.sort((a, b) => a.score - b.score);
    return [...starts, ...contains, ...fuzzy.map(f => f.item)];
  }

  function renderSearchResults(items) {
    currentResults = items;
    activeResultIndex = items.length ? 0 : -1;
    searchResultsEl.innerHTML = items.length
      ? items.map((item, i) => `
          <a class="site-search-result${i === 0 ? " active" : ""}" href="${resolveHref(item.href)}" data-index="${i}">
            <i class="${item.icon}"></i><span>${item.title}</span>
            ${item.context ? `<span class="site-search-context">in ${item.context}</span>` : ""}
          </a>
        `).join("")
      : `<div class="site-search-empty">No pages match.</div>`;
  }

  function updateActiveResult() {
    [...searchResultsEl.children].forEach((el, i) => el.classList.toggle("active", i === activeResultIndex));
  }

  function openSearch() {
    searchOverlay.hidden = false;
    searchInput.value = "";
    renderSearchResults(SEARCH_INDEX);
    searchInput.focus();
  }

  function closeSearch() {
    searchOverlay.hidden = true;
  }

  zone.querySelector("#sidebarSearchBtn").addEventListener("click", openSearch);
  searchInput.addEventListener("input", () => renderSearchResults(filterIndex(searchInput.value)));
  searchOverlay.addEventListener("click", e => { if (e.target === searchOverlay) closeSearch(); });

  // --- Keyboard shortcuts data ---
  // No sidebar button/overlay/hotkey anymore - Settings > Keyboard
  // Shortcuts is the only place this shows now. Still exposed on
  // window.BackbrainTheme since settings.js renders its own list from this
  // same array (one source of truth, not two copies of the shortcut text).
  const SHORTCUTS = [
    { keys: "Ctrl K", desc: "Open site search" },
    { keys: "Esc", desc: "Close the search panel" },
    { keys: "↑ / ↓", desc: "Move through search results" },
    { keys: "Enter", desc: "Open the highlighted search result" },
  ];
  window.BackbrainTheme.shortcuts = SHORTCUTS;

  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchOverlay.hidden ? openSearch() : closeSearch();
      return;
    }
    if (searchOverlay.hidden) return;
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeResultIndex < currentResults.length - 1) activeResultIndex++;
      updateActiveResult();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeResultIndex > 0) activeResultIndex--;
      updateActiveResult();
    } else if (e.key === "Enter") {
      const active = searchResultsEl.querySelector(".site-search-result.active");
      if (active) { e.preventDefault(); window.location.href = active.href; }
    }
  });
})();
