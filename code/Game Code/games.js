// "url" is the game's real, official site - where clicking a card actually
// launches it (opens in a new tab so the portal itself stays open). Five of
// the classic console titles below (Mario, Zelda, Sonic, Street Fighter II,
// Donkey Kong) are deliberately left without one: there's no legitimate free
// browser version to point them at, and linking a piracy-adjacent ROM/emulator
// site to make them "work" isn't worth doing - the card just shows as
// not-yet-launchable instead (see render() and the no-launch note below).
// Pac-Man is the exception among the classics: Google's official 30th-
// anniversary version is free and legal to link, so it launches like the rest.
const cards = [
  { id: 1, title: "Agar.io", dateAdded: "2026-07-03", image: "images/agar-io.png", url: "https://agar.io",
    tags: ["multiplayer", "arcade", "web"], description: "Grow a cell by absorbing smaller players in this browser-based multiplayer arena.",
    developer: "Matheus Valadares" },
  { id: 2, title: "Slither.io", dateAdded: "2026-07-03", image: "images/slither-io.svg", url: "https://slither.io",
    tags: ["multiplayer", "arcade", "web"], description: "Guide a growing snake around the arena while cutting off rivals.",
    developer: "Steve Howse" },
  { id: 3, title: "2048", dateAdded: "2026-07-03", image: "images/2048.svg", url: "https://play2048.co",
    tags: ["puzzle", "singleplayer", "web"], description: "A sliding tile puzzle where matching numbers double until you reach 2048.",
    developer: "Gabriele Cirulli" },
  { id: 4, title: "Super Mario Bros.", dateAdded: "2026-07-03", image: "images/super-mario-bros.svg", url: null,
    tags: ["platformer", "classic", "emulator"], description: "The NES platformer that sent Mario racing and jumping across the Mushroom Kingdom.",
    developer: "Nintendo" },
  { id: 5, title: "The Legend of Zelda", dateAdded: "2026-07-03", image: "images/legend-of-zelda.svg", url: null,
    tags: ["adventure", "classic", "emulator"], description: "An open-world NES adventure through the kingdom of Hyrule.",
    developer: "Nintendo" },
  { id: 6, title: "Cookie Clicker", dateAdded: "2026-07-03", image: "images/cookie-clicker.svg", url: "https://orteil.dashnet.org/cookieclicker/",
    tags: ["idle", "casual", "web"], description: "An incremental clicker about baking an ever-growing pile of cookies.",
    developer: "Julien Thiennot" },
  { id: 7, title: "Sonic the Hedgehog", dateAdded: "2026-07-03", image: "images/sonic-the-hedgehog.svg", url: null,
    tags: ["platformer", "classic", "emulator"], description: "A high-speed Genesis platformer starring Sega's blue mascot.",
    developer: "Sega" },
  { id: 8, title: "Wordle", dateAdded: "2026-07-03", image: "images/wordle.svg", url: "https://www.nytimes.com/games/wordle/index.html",
    tags: ["puzzle", "daily", "web"], description: "Guess the five-letter word of the day in six tries or fewer.",
    developer: "Josh Wardle" },
  { id: 9, title: "Diep.io", dateAdded: "2026-07-03", image: "images/diep-io.svg", url: "https://diep.io",
    tags: ["multiplayer", "shooter", "web"], description: "Upgrade a tank through branching classes while battling other players.",
    developer: "Matheus Valadares" },
  { id: 10, title: "Pac-Man", dateAdded: "2026-07-03", image: "images/pac-man.svg", url: "https://www.google.com/logos/2010/pacman10-i.html",
    tags: ["arcade", "classic", "web"], description: "The maze-chase arcade classic, playable free via Google's official 30th-anniversary version.",
    developer: "Namco" },
  { id: 11, title: "Street Fighter II", dateAdded: "2026-07-03", image: "images/street-fighter-ii.svg", url: null,
    tags: ["fighting", "classic", "emulator"], description: "The arcade fighter that defined one-on-one competitive fighting games.",
    developer: "Capcom" },
  { id: 12, title: "Donkey Kong", dateAdded: "2026-07-03", image: "images/donkey-kong.svg", url: null,
    tags: ["platformer", "classic", "emulator"], description: "The arcade original where Mario (then \"Jumpman\") first climbed to save Pauline.",
    developer: "Nintendo" },
  { id: 13, title: "Krunker.io", dateAdded: "2026-07-18", image: "images/krunker-io.svg", url: "https://krunker.io",
    tags: ["shooter", "multiplayer", "web"], description: "A fast, blocky browser FPS with classes, movement tricks, and public arenas.",
    developer: "Yendis Entertainment" },
  { id: 14, title: "Shell Shockers", dateAdded: "2026-07-18", image: "images/shell-shockers.svg", url: "https://shellshock.io",
    tags: ["shooter", "multiplayer", "web"], description: "An online FPS where everyone is a heavily armed egg trying not to crack.",
    developer: "Blue Wizard Digital" },
  { id: 15, title: "Skribbl.io", dateAdded: "2026-07-18", image: "images/skribbl-io.svg", url: "https://skribbl.io",
    tags: ["drawing", "multiplayer", "web"], description: "Take turns drawing a secret word while everyone else races to guess it.",
    developer: "skribbl.io" },
  { id: 16, title: "Tetr.io", dateAdded: "2026-07-18", image: "images/tetrio.svg", url: "https://tetr.io",
    tags: ["puzzle", "multiplayer", "web"], description: "Competitive modern Tetris with online multiplayer and configurable handling.",
    developer: "osk" },
  { id: 17, title: "Lichess", dateAdded: "2026-07-18", image: "images/lichess.svg", url: "https://lichess.org",
    tags: ["strategy", "multiplayer", "web"], description: "Free, open-source chess: play, learn, solve puzzles, and analyze your games.",
    developer: "Lichess (open source)" },
  { id: 18, title: "Gartic Phone", dateAdded: "2026-07-18", image: "images/gartic-phone.svg", url: "https://garticphone.com",
    tags: ["drawing", "multiplayer", "web"], description: "Broken-telephone with drawings - write a prompt, then watch it mutate hilariously.",
    developer: "Onrizon Social Games" },
  { id: 19, title: "Powerline.io", dateAdded: "2026-07-18", image: "images/powerline-io.svg", url: "https://powerline.io",
    tags: ["arcade", "multiplayer", "web"], description: "A neon take on Snake - grow the longest and cut off rivals in a shared arena.",
    developer: "powerline.io" },
  { id: 20, title: "MooMoo.io", dateAdded: "2026-07-18", image: "images/moomoo-io.svg", url: "https://moomoo.io",
    tags: ["survival", "multiplayer", "web"], description: "Gather resources, build a base, and defend it in this survival .io game.",
    developer: "Sidney de Vries" },
  { id: 21, title: "1v1.LOL", dateAdded: "2026-07-18", image: "images/1v1-lol.svg", url: "https://1v1.lol",
    tags: ["shooter", "multiplayer", "web"], description: "Build-and-battle third-person shooter with quick 1v1 and battle-royale modes.",
    developer: "JustPlay.LOL" },
  { id: 22, title: "Territorial.io", dateAdded: "2026-07-18", image: "images/territorial-io.svg", url: "https://territorial.io",
    tags: ["strategy", "multiplayer", "web"], description: "Simple, huge-scale territory conquest against hundreds of bots and players.",
    developer: "territorial.io" },
  { id: 23, title: "Hextris", dateAdded: "2026-07-18", image: "images/hextris.svg", url: "https://hextris.io",
    tags: ["puzzle", "singleplayer", "web"], description: "A hexagonal spin on falling-block puzzles - rotate the hub to match colors.",
    developer: "Hextris (open source)" },
  { id: 24, title: "Sudoku", dateAdded: "2026-07-18", image: "images/sudoku.svg", url: "https://sudoku.com",
    tags: ["puzzle", "singleplayer", "web"], description: "Classic number-placement puzzles across a range of difficulty levels.",
    developer: "Easybrain" },
];

const RESERVED_TAGS = ["web", "emulator", "favorite"];

const tabsEl = document.getElementById("tabs");
const gridEl = document.getElementById("cardGrid");
const gameCountEl = document.getElementById("gameCount");
const searchEl = document.getElementById("search");
const clearSearchEl = document.getElementById("clearSearch");
const sortByEl = document.getElementById("sortBy");
const sortDirEl = document.getElementById("sortDir");
const tagsAccordionEl = document.getElementById("tagsAccordion");
const tagsToggleEl = document.getElementById("tagsToggle");
const tagOptionsEl = document.getElementById("tagOptions");
let activeCategory = "all";
let ascending = true;
const selectedTags = new Set();

function hashTag(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash % 360;
}

const FAVORITES_STORAGE_KEY = "gamePortalFavorites";

function loadFavoriteIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY));
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {}
  return new Set();
}

function saveFavoriteIds() {
  try {
    const ids = cards.filter(card => card.tags.includes("favorite")).map(card => card.id);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

const savedFavoriteIds = loadFavoriteIds();
cards.forEach(card => {
  if (savedFavoriteIds.has(card.id) && !card.tags.includes("favorite")) {
    card.tags.push("favorite");
  }
});

// --- Recently played ---
// Recorded when a launchable card is actually opened (see launchCard). Newest
// first, de-duped, capped - powers the "Recently Played" tab. Stored as bare
// ids and resolved back to cards at render time, so a removed game just drops
// out of the list on its own.
const RECENT_STORAGE_KEY = "gameRecentlyPlayed";
const RECENT_LIMIT = 12;

function loadRecentIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY));
    if (Array.isArray(parsed)) return parsed.filter(id => Number.isInteger(id));
  } catch {}
  return [];
}

function recordRecentlyPlayed(id) {
  const ids = loadRecentIds().filter(existing => existing !== id);
  ids.unshift(id);
  try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(0, RECENT_LIMIT))); } catch {}
}

// Touch devices have no hover to reveal a card's info overlay, so there the
// first tap reveals it and the second launches (see the click handler in
// render). matchMedia is the reliable "is this a hover-capable pointer" test.
const canHover = window.matchMedia("(hover: hover)").matches;

// Shared by mouse click, the touch second-tap, and keyboard Enter/Space so all
// three launch identically and all record recency.
function launchCard(card) {
  history.replaceState(null, "", `#game-${card.id}`);
  if (!card.url) return;
  recordRecentlyPlayed(card.id);
  window.open(card.url, "_blank", "noopener");
}

tabsEl.addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  [...tabsEl.children].forEach(tab => tab.classList.toggle("active", tab === btn));
  selectedTags.clear();
  renderTagOptions();
  sortAndRender();
});

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

// Lazily loads/unloads card images as they scroll in and out of view, so a
// much larger game list wouldn't force every image to load up front.
const virtualConfig = {
  enabled: true,
  bufferMargin: "300px",
  unloadDelay: 400,
  resizeDebounce: 150,
};

const virtualSupported =
  typeof IntersectionObserver !== "undefined" &&
  typeof ResizeObserver !== "undefined";

const cardData = new WeakMap();
const pendingUnloads = new WeakMap();
let loadQueue = new Set();
let unloadQueue = new Set();
let flushScheduled = false;

function loadCardContent(cardEl, card) {
  if (cardEl.dataset.loaded === "true") return;
  const img = cardEl.querySelector("img");
  const markLoaded = () => {
    img.classList.add("loaded");
    cardEl.classList.add("loaded");
  };
  img.addEventListener("load", markLoaded);
  img.addEventListener("error", markLoaded);
  img.src = card.image;
  cardEl.dataset.loaded = "true";
}

function unloadCardContent(cardEl) {
  if (cardEl.dataset.loaded !== "true") return;
  const img = cardEl.querySelector("img");
  img.removeAttribute("src");
  img.classList.remove("loaded");
  cardEl.classList.remove("loaded");
  cardEl.dataset.loaded = "false";
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  requestAnimationFrame(() => {
    flushScheduled = false;
    loadQueue.forEach(cardEl => loadCardContent(cardEl, cardData.get(cardEl)));
    unloadQueue.forEach(cardEl => {
      if (!loadQueue.has(cardEl)) unloadCardContent(cardEl);
    });
    loadQueue.clear();
    unloadQueue.clear();
  });
}

function requestLoad(cardEl) {
  const pending = pendingUnloads.get(cardEl);
  if (pending) {
    clearTimeout(pending);
    pendingUnloads.delete(cardEl);
  }
  unloadQueue.delete(cardEl);
  loadQueue.add(cardEl);
  scheduleFlush();
}

function requestUnload(cardEl) {
  if (pendingUnloads.has(cardEl)) return;
  const timeoutId = setTimeout(() => {
    pendingUnloads.delete(cardEl);
    loadQueue.delete(cardEl);
    unloadQueue.add(cardEl);
    scheduleFlush();
  }, virtualConfig.unloadDelay);
  pendingUnloads.set(cardEl, timeoutId);
}

let intersectionObserver = null;
let resizeObserver = null;

function setupVirtualizationObservers() {
  if (!virtualConfig.enabled || !virtualSupported) return;

  intersectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) requestLoad(entry.target);
        else requestUnload(entry.target);
      });
    },
    { rootMargin: virtualConfig.bufferMargin, threshold: 0 }
  );

  let resizeTimer = null;
  const refresh = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      [...gridEl.children].forEach(cardEl => {
        intersectionObserver.unobserve(cardEl);
        intersectionObserver.observe(cardEl);
      });
    }, virtualConfig.resizeDebounce);
  };

  resizeObserver = new ResizeObserver(refresh);
  resizeObserver.observe(gridEl);
  window.addEventListener("resize", refresh);
}

setupVirtualizationObservers();

function cardsInActiveCategory() {
  if (activeCategory === "all") return cards;
  // "recent" isn't a tag - it's the recency list, resolved to cards in order
  // (newest first). filter(Boolean) drops any id whose game no longer exists.
  if (activeCategory === "recent") {
    return loadRecentIds().map(id => cards.find(card => card.id === id)).filter(Boolean);
  }
  return cards.filter(card => card.tags.includes(activeCategory));
}

function renderTagOptions() {
  const tagsInCategory = [...new Set(
    cardsInActiveCategory().flatMap(card => card.tags)
  )].filter(tag => !RESERVED_TAGS.includes(tag)).sort();
  tagOptionsEl.innerHTML = tagsInCategory.map(tag => `
    <button type="button" class="tag-option${selectedTags.has(tag) ? " selected" : ""}" data-tag="${tag}" style="--tag-hue:${hashTag(tag)}">${tag}</button>
  `).join("");

  [...tagOptionsEl.children].forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) selectedTags.delete(tag);
      else selectedTags.add(tag);
      renderTagOptions();
      sortAndRender();
    });
  });
}

tagsToggleEl.addEventListener("click", () => {
  tagsAccordionEl.classList.toggle("open");
});

clearSearchEl.addEventListener("click", () => {
  searchEl.value = "";
  selectedTags.clear();
  renderTagOptions();
  sortAndRender();
});

searchEl.addEventListener("input", sortAndRender);

// Touch: tapping anywhere outside a card dismisses an open info overlay, the
// same way tapping another card swaps it (a no-op on hover devices, which
// never add the info-open class in the first place).
document.addEventListener("click", e => {
  if (!e.target.closest(".game-card")) {
    gridEl.querySelectorAll(".game-card.info-open").forEach(card => card.classList.remove("info-open"));
  }
});

sortByEl.addEventListener("change", sortAndRender);
sortDirEl.addEventListener("click", () => {
  ascending = !ascending;
  sortDirEl.textContent = ascending ? "Ascending ▲" : "Descending ▼";
  sortDirEl.dataset.dir = ascending ? "asc" : "desc";
  sortAndRender();
});

function render(data) {
  if (intersectionObserver) intersectionObserver.disconnect();
  loadQueue.clear();
  unloadQueue.clear();

  if (data.length === 0) {
    gridEl.innerHTML = `<p class="empty-state">No games match your filters.</p>`;
    return;
  }

  gridEl.innerHTML = data.map((card, i) => `
    <div class="game-card${card.url ? "" : " no-launch"}" id="game-${card.id}" data-loaded="false" style="--i:${i}" role="button" tabindex="0" aria-label="${card.title}${card.url ? "" : " (not launchable yet)"}">
      <img alt="${card.title}">
      <div class="scrim"></div>
      <div class="title">${card.title}</div>
      <div class="info">
        <div class="tags">
          ${[...card.tags].filter(tag => !RESERVED_TAGS.includes(tag)).sort()
            .map(tag => `<span class="tag" style="--tag-hue:${hashTag(tag)}">${tag}</span>`).join("")}
        </div>
        <div class="desc">${card.description}</div>
        <div class="developer">${card.developer} · Added ${formatDate(card.dateAdded)}</div>
        ${card.url ? "" : `<div class="no-launch-note">No legitimate free source linked yet</div>`}
      </div>
      <button type="button" class="favorite-btn${card.tags.includes("favorite") ? " active" : ""}" aria-label="Toggle favorite">★</button>
    </div>
  `).join("");

  [...gridEl.children].forEach((cardEl, i) => {
    const card = data[i];
    cardData.set(cardEl, card);
    cardEl.addEventListener("click", () => {
      // Touch (no hover): first tap reveals the info overlay, second tap
      // launches. Desktop launches immediately - its info shows on hover.
      if (!canHover && !cardEl.classList.contains("info-open")) {
        gridEl.querySelectorAll(".game-card.info-open").forEach(other => {
          if (other !== cardEl) other.classList.remove("info-open");
        });
        cardEl.classList.add("info-open");
        return;
      }
      launchCard(card);
    });

    cardEl.addEventListener("keydown", e => {
      // Only when the card itself is focused - not the favorite button inside
      // it, which has its own native activation.
      if (e.target !== cardEl) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        launchCard(card);
      }
    });

    const favoriteBtn = cardEl.querySelector(".favorite-btn");
    favoriteBtn.addEventListener("click", e => {
      e.stopPropagation();
      const isFavorited = card.tags.includes("favorite");
      if (isFavorited) card.tags = card.tags.filter(tag => tag !== "favorite");
      else card.tags.push("favorite");
      favoriteBtn.classList.toggle("active", !isFavorited);
      saveFavoriteIds();
      if (activeCategory === "favorite" && isFavorited) sortAndRender();
    });

    if (virtualConfig.enabled && virtualSupported) {
      intersectionObserver.observe(cardEl);
    } else {
      loadCardContent(cardEl, card);
    }
  });
}

function sortAndRender() {
  const query = searchEl.value.trim().toLowerCase();
  const inCategory = cardsInActiveCategory();
  const filtered = inCategory.filter(card =>
    card.title.toLowerCase().includes(query) &&
    [...selectedTags].every(tag => card.tags.includes(tag))
  );

  // The Recently Played tab is inherently ordered by recency, so the sort
  // controls don't apply there - keep that order and grey the controls out.
  const isRecent = activeCategory === "recent";
  sortByEl.disabled = isRecent;
  sortDirEl.disabled = isRecent;

  const key = sortByEl.value;
  const sorted = isRecent ? filtered : filtered.sort((a, b) => {
    const result = key === "title" ? a.title.localeCompare(b.title) : a.dateAdded.localeCompare(b.dateAdded) || (a.id - b.id);
    return ascending ? result : -result;
  });

  gameCountEl.textContent = sorted.length === inCategory.length
    ? `${inCategory.length} game${inCategory.length === 1 ? "" : "s"}`
    : `Showing ${sorted.length} of ${inCategory.length} games`;

  render(sorted);
}

const hashMatch = location.hash.match(/^#game-(\d+)$/);
const linkedCard = hashMatch && cards.find(c => c.id === Number(hashMatch[1]));

renderTagOptions();
sortAndRender();

if (linkedCard) {
  const target = document.getElementById(`game-${linkedCard.id}`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlight");
    setTimeout(() => target.classList.remove("highlight"), 2000);
  }
}
