const CREDITS = [
];

const listEl = document.getElementById("creditList");
const emptyEl = document.getElementById("emptyState");

if (CREDITS.length === 0) {
  emptyEl.hidden = false;
} else {
  listEl.innerHTML = CREDITS.map(credit => `
    <li class="credit-item">
      <div class="title">${credit.title}</div>
      <div class="meta">
        ${credit.author ? `Photo/asset by ${credit.author} — ` : ""}${credit.license}
        — <a href="${credit.source}" target="_blank" rel="noopener">source</a>
      </div>
    </li>
  `).join("");
}
