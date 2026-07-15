// "birthday" is "MM-DD" (no year - just used to check against today's date)
// and left unset for everyone below since real birthdates aren't something
// to guess at. Fill one in and that member gets a 🎂 badge on their card
// and profile popup automatically on the day.
const TEAM = [
  // Matches the Discord invite username ("Raptorman") and the Raptor.jpeg
  // filename you added — flag if this guess is wrong.
  { name: "Raptor", role: "Founder", group: "Leadership", avatar: "images/Raptor.jpeg", bio: "The boss. No real hierarchy below this — everyone else just does what's asked of them.", birthday: null },
  { name: "Karl", role: "Developer", group: "Developers", avatar: "images/Karl.jpeg", birthday: null },
  { name: "I_AM_COMPUTER", role: "Developer", group: "Developers", avatar: "images/I_AM_COMPUTER.jpeg", birthday: null },
  { name: "Rice", role: "Developer", group: "Developers", avatar: "images/Rice.jpeg", birthday: null },
  { name: "Sherma", role: "Designer", group: "Designers", avatar: "images/Sherma.jpeg", birthday: null },
  { name: "Cobalt", role: "Gruntwork", group: "Gruntwork", avatar: "images/Cobalt.jpeg", birthday: null },
  { name: "Shadow", role: "Gruntwork", group: "Gruntwork", avatar: "images/Shadow.jpeg", birthday: null },
  { name: "IGotGassed", role: "Gruntwork", group: "Gruntwork", avatar: "images/IGotGassed.jpeg", birthday: null },
  { name: "HOBO", role: "Gruntwork", group: "Gruntwork", avatar: "images/HOBO.jpeg", birthday: null },
];

function isBirthdayToday(member) {
  if (!member.birthday) return false;
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return member.birthday === `${mm}-${dd}`;
}

const grid = document.getElementById("teamGrid");
const emptyEl = document.getElementById("emptyState");

const modal = document.getElementById("memberModal");
const modalAvatar = document.getElementById("modalAvatar");
const modalName = document.getElementById("modalName");
const modalRole = document.getElementById("modalRole");
const modalBio = document.getElementById("modalBio");
const modalLinks = document.getElementById("modalLinks");
const closeMemberModal = document.getElementById("closeMemberModal");

function avatarHtml(member, className) {
  const initial = (member.name.trim().charAt(0) || "?").toUpperCase();
  // Resolved through BackbrainTheme.resolveAsset (sidebar.js, loaded first)
  // rather than a plain relative path - team.html sits one folder deep
  // (Tabs/team.html), so "images/Raptor.jpeg" on its own would resolve to
  // the nonexistent Tabs/images/ instead of the real site-root images/.
  return member.avatar
    ? `<img class="${className}" src="${window.BackbrainTheme.resolveAsset(member.avatar)}" alt="${member.name}" loading="lazy" width="96" height="96">`
    : `<div class="${className}-fallback">${initial}</div>`;
}

function linksHtml(member) {
  return (member.links || [])
    .map(l => `<a href="${l.url}" target="_blank" rel="noopener" title="${l.label || ""}"><i class="${l.icon}"></i></a>`)
    .join("");
}

function birthdayBadgeHtml(member) {
  return isBirthdayToday(member) ? `<span class="birthday-badge" title="Happy birthday!">🎂</span>` : "";
}

function renderMember(member) {
  const links = linksHtml(member);
  return `
    <div class="team-card" data-team-index="${TEAM.indexOf(member)}">
      ${avatarHtml(member, "team-avatar")}
      <div class="team-name">${member.name} ${birthdayBadgeHtml(member)}</div>
      <div class="team-role">${member.role}</div>
      ${member.bio ? `<div class="team-bio">${member.bio}</div>` : ""}
      ${links ? `<div class="team-links">${links}</div>` : ""}
    </div>
  `;
}

function openMemberModal(member) {
  modalAvatar.innerHTML = avatarHtml(member, "team-avatar");
  modalName.innerHTML = `${member.name} ${birthdayBadgeHtml(member)}`;
  modalRole.textContent = member.role;
  const bioText = member.fullBio || member.bio || "";
  modalBio.textContent = bioText;
  modalBio.hidden = !bioText;
  const links = linksHtml(member);
  modalLinks.innerHTML = links;
  modalLinks.hidden = !links;
  modal.hidden = false;
}

closeMemberModal.addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) modal.hidden = true; });

function groupByOrder(items, key) {
  const order = [];
  const map = new Map();
  items.forEach(item => {
    const k = item[key] || "Team";
    if (!map.has(k)) {
      map.set(k, []);
      order.push(k);
    }
    map.get(k).push(item);
  });
  return order.map(name => ({ name, members: map.get(name) }));
}

if (TEAM.length === 0) {
  emptyEl.hidden = false;
} else {
  const sections = groupByOrder(TEAM, "group");
  grid.innerHTML = sections.map(section => `
    <div class="team-section">
      <h2 class="team-section-title">${section.name}</h2>
      <div class="team-section-grid">
        ${section.members.map(renderMember).join("")}
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".team-card").forEach(cardEl => {
    cardEl.addEventListener("click", () => {
      openMemberModal(TEAM[Number(cardEl.dataset.teamIndex)]);
    });
  });

  const hashMatch = location.hash.match(/^#member-(.+)$/);
  const linkedMember = hashMatch && TEAM.find(m => m.name === decodeURIComponent(hashMatch[1]));
  if (linkedMember) openMemberModal(linkedMember);
}
