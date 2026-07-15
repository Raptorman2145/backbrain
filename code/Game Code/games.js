// "url" is the game's real, official site - where clicking a card actually
// launches it (opens in a new tab so the portal itself stays open). The six
// "emulator"-tagged entries are left without one on purpose: there's no
// legitimate free ROM/emulator source to point them at, and linking to a
// piracy-adjacent ROM site to make them "work" isn't worth doing - the
// card just shows as not-yet-launchable instead. See render()/cardClick()
// below for how the two states differ.
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
  { id: 10, title: "Pac-Man", dateAdded: "2026-07-03", image: "images/pac-man.svg", url: null,
    tags: ["arcade", "classic", "emulator"], description: "The original maze-chase arcade game, gobbling dots while dodging ghosts.",
    developer: "Namco" },
  { id: 11, title: "Street Fighter II", dateAdded: "2026-07-03", image: "images/street-fighter-ii.svg", url: null,
    tags: ["fighting", "classic", "emulator"], description: "The arcade fighter that defined one-on-one competitive fighting games.",
    developer: "Capcom" },
  { id: 12, title: "Donkey Kong", dateAdded: "2026-07-03", image: "images/donkey-kong.svg", url: null,
    tags: ["platformer", "classic", "emulator"], description: "The arcade original where Mario (then \"Jumpman\") first climbed to save Pauline.",
    developer: "Nintendo" },
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
  return activeCategory === "all"
    ? cards
    : cards.filter(card => card.tags.includes(activeCategory));
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
    <div class="game-card${card.url ? "" : " no-launch"}" id="game-${card.id}" data-loaded="false" style="--i:${i}">
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
      history.replaceState(null, "", `#game-${card.id}`);
      if (card.url) window.open(card.url, "_blank", "noopener");
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

  const key = sortByEl.value;
  const sorted = filtered.sort((a, b) => {
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
