// Shared identity/profile layer for Chatroom. Loaded after the Firebase
// Database compat SDK and after CHAT.html has already called
// firebase.initializeApp() with the user's pasted config - every function
// here assumes an initialized default app already exists.
//
// No Firebase Authentication here on purpose: Identity Toolkit (what
// signInAnonymously()/etc. need) turned out to require Google Cloud account
// activation (payment verification) even for free-tier usage, which isn't
// something this tool can ask a visitor to do. Instead, a display name IS
// the identity, protected by a password the claimant sets - hashed
// client-side with PBKDF2, the exact same primitive this file's predecessor
// used for the old room-passphrase scheme, just applied per-name instead of
// per-room. Realtime Database rules can't verify a password server-side (no
// backend to run PBKDF2), so exclusivity is enforced by this file's own JS,
// not by rules - the honest limitation is that a client bypassing the UI
// entirely (raw REST calls) could still write over a name it doesn't know
// the password for. For anyone using the actual chat, this is real
// protection: nobody can post as an existing name without its password.
//
// Exposes window.BackbrainIdentity, following the same window.BackbrainX
// convention sidebar.js already uses for cross-script globals on this site.
(function () {
  const PBKDF2_ITERATIONS = 150000;
  const SESSION_KEY = 'chat_identity';
  const AVATAR_MAX_DIM = 128; // small on purpose - avatars live as base64 in the database, not real file storage
  const BANNER_MAX_DIM = 480; // wider canvas than an avatar, still base64-in-database so kept modest
  // A deleted name isn't instantly up for grabs - held for a cooldown first
  // so nobody can immediately re-register someone else's just-deleted name
  // and start posting as them. deleteAccount() below replaces the profile
  // with a small tombstone {deletedTombstone, deletedAt} instead of removing
  // it outright; claimOrLogin() checks the cooldown before allowing a fresh
  // claim over a tombstone.
  const DELETE_RECLAIM_COOLDOWN_MS = 15 * 60 * 1000;

  function tombstoneCooldownRemainingMs(profile) {
    return DELETE_RECLAIM_COOLDOWN_MS - (Date.now() - (profile.deletedAt || 0));
  }
  function isReclaimable(profile) {
    return !!profile && !!profile.deletedTombstone && tombstoneCooldownRemainingMs(profile) <= 0;
  }
  function cooldownMessage(profile) {
    const mins = Math.max(1, Math.ceil(tombstoneCooldownRemainingMs(profile) / 60000));
    return `This name was just freed up by a deleted account - it's held for a bit before anyone can reclaim it. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`;
  }

  function b64FromBytes(bytes) {
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function bytesFromB64(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  }

  async function deriveHash(password, saltBytes) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey, 256
    );
    return b64FromBytes(new Uint8Array(bits));
  }

  function normalizeUsername(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // Realtime Database keys can't contain '.', '#', '$', '[', ']', or '/' -
  // strip anything outside a conservative safe set rather than just the
  // characters known to break paths, so weird unicode/punctuation can't
  // sneak through unnoticed either.
  function sanitizeUsernameKey(normalized) {
    return normalized.replace(/[^a-z0-9 _-]/g, '');
  }

  function profileRef(key) {
    return firebase.database().ref('profiles/' + key);
  }

  // Claims a brand-new name (setting its password) or logs into an existing
  // one (verifying the password matches). Either way returns the profile.
  async function claimOrLogin(displayName, password) {
    const trimmed = String(displayName || '').trim();
    if (!trimmed) throw new Error('Display name cannot be empty.');
    if (trimmed.length > 32) throw new Error('Display name is too long (32 characters max).');
    if (!password || password.length < 4) throw new Error('Choose a password (at least 4 characters) to protect this name.');
    const key = sanitizeUsernameKey(normalizeUsername(trimmed));
    if (!key) throw new Error('That name has no usable characters - try letters or numbers.');

    const ref = profileRef(key);
    const existing = (await ref.once('value')).val();

    if (existing && !isReclaimable(existing)) {
      if (existing.deletedTombstone) throw new Error(cooldownMessage(existing));
      const hash = await deriveHash(password, bytesFromB64(existing.salt));
      if (hash !== existing.hash) throw new Error('That name is already taken - wrong password.');
      return { key, profile: existing, isNew: false };
    }

    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = b64FromBytes(saltBytes);
    const hash = await deriveHash(password, saltBytes);
    const fresh = {
      displayName: trimmed, salt, hash,
      bio: '', accentColor: '#e64848', statusLine: '', pronouns: '',
      avatarDataUrl: null,
      createdAt: Date.now(),
    };
    // Transaction, not a plain set() - two people claiming the same fresh
    // (or just-expired-tombstone) name in the same instant must not both
    // "win" it.
    const result = await ref.transaction(current => {
      if (current === null) return fresh;
      if (isReclaimable(current)) return fresh;
      return undefined;
    });
    if (!result.committed) return claimOrLogin(displayName, password); // lost the race, or cooldown hadn't actually expired - retry re-evaluates and throws the right error
    return { key, profile: result.snapshot.val(), isNew: true };
  }

  // Replaces the profile with a small tombstone rather than removing it
  // outright - see DELETE_RECLAIM_COOLDOWN_MS above. Password/bio/avatar/etc
  // are all gone immediately either way; only the *name* is held back.
  async function deleteAccount(key) {
    await profileRef(key).set({ deletedTombstone: true, deletedAt: Date.now() });
  }

  // Re-derives salt+hash in place, same primitive claimOrLogin() uses to set
  // them originally - requires the CURRENT password (not just being logged
  // in) since this is the one thing standing between "someone at your
  // already-unlocked screen" and actually taking over the account going
  // forward.
  async function changePassword(key, oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 4) throw new Error('Choose a new password (at least 4 characters).');
    const ref = profileRef(key);
    const existing = (await ref.once('value')).val();
    if (!existing || existing.deletedTombstone) throw new Error("This account doesn't exist.");
    const oldHash = await deriveHash(oldPassword, bytesFromB64(existing.salt));
    if (oldHash !== existing.hash) throw new Error('Current password is incorrect.');
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = b64FromBytes(saltBytes);
    const hash = await deriveHash(newPassword, saltBytes);
    await ref.update({ salt, hash });
  }

  function saveSession(displayName, password) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ displayName, password }));
  }
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function getProfile(key) {
    const snap = await profileRef(key).once('value');
    return snap.val();
  }

  // Live-updates cb on every future change too, so e.g. an avatar someone
  // just changed updates everywhere their past messages are still on screen.
  // Returns an unsubscribe function.
  function watchProfile(key, cb) {
    const ref = profileRef(key);
    const handler = snap => cb(snap.val());
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }

  // fields: any subset of { bio, accentColor, statusLine, pronouns,
  // avatarDataUrl }. Renaming isn't a field edit here - that's a fresh
  // claimOrLogin() call, since the name itself is the identity's key.
  async function saveProfileFields(key, fields) {
    await profileRef(key).update(fields);
  }

  // --- Avatar: downscale client-side, store inline as a data URL ---
  // No Firebase Storage (also gated behind the same account-activation wall
  // as Auth) - small avatars as base64 directly in the database instead.
  function downscaleImageToDataUrl(file, maxDim) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('That file is not a readable image.'));
      };
      img.src = objectUrl;
    });
  }

  async function uploadAvatar(key, file) {
    if (!file.type || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    const dataUrl = await downscaleImageToDataUrl(file, AVATAR_MAX_DIM);
    if (dataUrl.length > 60000) throw new Error('That image is too complex to shrink small enough - try a simpler picture.');
    await saveProfileFields(key, { avatarDataUrl: dataUrl });
    return dataUrl;
  }

  async function uploadBanner(key, file) {
    if (!file.type || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    const dataUrl = await downscaleImageToDataUrl(file, BANNER_MAX_DIM);
    if (dataUrl.length > 200000) throw new Error('That image is too complex to shrink small enough - try a simpler picture.');
    await saveProfileFields(key, { bannerDataUrl: dataUrl });
    return dataUrl;
  }

  async function removeBanner(key) {
    await saveProfileFields(key, { bannerDataUrl: null });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Mirrors code/CSS/team.css's existing .team-avatar / .team-avatar-fallback
  // pattern (image if one exists, an initial-letter circle if not) so a
  // profile picture reads as the same visual language as the Team page's.
  function avatarHtml(profile, className) {
    const name = (profile && profile.displayName) || '?';
    const initial = escapeHtml(name.trim().charAt(0).toUpperCase() || '?');
    if (profile && profile.avatarDataUrl) {
      return `<img class="${className}" src="${profile.avatarDataUrl}" alt="${escapeHtml(name)}">`;
    }
    return `<div class="${className}-fallback">${initial}</div>`;
  }

  window.BackbrainIdentity = {
    claimOrLogin,
    saveSession,
    loadSession,
    clearSession,
    get: getProfile,
    watch: watchProfile,
    saveProfileFields,
    uploadAvatar,
    uploadBanner,
    removeBanner,
    deleteAccount,
    changePassword,
    avatarHtml,
    normalizeUsername,
    sanitizeUsernameKey,
  };
})();
