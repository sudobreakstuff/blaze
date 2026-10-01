// Blaze — the photo wall + gallery.
// Photos are downscaled and kept in this browser's localStorage. Nothing is
// ever uploaded; they live on Jasmine's device only.

const KEY = "blaze.photos";
const MAX_DIM = 900;
const MAX_PHOTOS = 60;
const QUALITY = 0.78;

const storage = (typeof localStorage !== "undefined")
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let list = load();
let wallEl = null;
let onChange = () => {};
let onNote = () => {};
let galleryEl = null;
let lightboxEl = null;
let current = 0;

function load() {
  try { const a = JSON.parse(storage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function persist() {
  try { storage.setItem(KEY, JSON.stringify(list)); return true; }
  catch { return false; }
}

function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * s));
      const h = Math.max(1, Math.round(img.height * s));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL("image/jpeg", QUALITY)); } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("not an image")); };
    img.src = url;
  });
}

function tiltFor(id) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 9) - 4) * 0.9;
}
function idx(id) { return list.findIndex((p) => p.id === id); }

// ---------------- wall ----------------
function render() {
  if (!wallEl) return;
  wallEl.innerHTML = "";
  if (!list.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = "no photos yet 🌙<br>tap here (or ⚙ settings) to add some";
    wallEl.appendChild(e);
    return;
  }
  for (const p of list) {
    const d = document.createElement("div");
    d.className = "photo";
    d.style.setProperty("--tilt", tiltFor(p.id) + "deg");
    const img = document.createElement("img");
    img.src = p.data; img.alt = p.caption || "a photo on Blaze's wall";
    const rm = document.createElement("button");
    rm.className = "rm"; rm.textContent = "×"; rm.title = "remove";
    rm.addEventListener("click", (ev) => { ev.stopPropagation(); removePhoto(p.id); });
    d.appendChild(img); d.appendChild(rm);
    if (p.caption) { const c = document.createElement("div"); c.className = "cap"; c.textContent = p.caption; d.appendChild(c); }
    d.addEventListener("click", () => openLightbox(idx(p.id)));
    wallEl.appendChild(d);
  }
}

// ---------------- lightbox ----------------
function ensureLightbox() {
  if (lightboxEl) return;
  lightboxEl = document.createElement("div");
  lightboxEl.className = "lightbox";
  lightboxEl.addEventListener("click", (e) => { if (e.target === lightboxEl) closeLightbox(); });
  document.body.appendChild(lightboxEl);
}
function openLightbox(i) {
  if (!list.length) return;
  current = ((i % list.length) + list.length) % list.length;
  ensureLightbox();
  const p = list[current];
  lightboxEl.innerHTML = "";
  const img = document.createElement("img"); img.src = p.data;
  const cap = document.createElement("div"); cap.className = "lb-cap"; cap.textContent = p.caption || "—";
  const bar = document.createElement("div"); bar.className = "lb-bar";
  const prev = document.createElement("button"); prev.textContent = "‹";
  const next = document.createElement("button"); next.textContent = "›";
  const edit = document.createElement("button"); edit.textContent = "✎ caption";
  const del = document.createElement("button"); del.textContent = "🗑 remove"; del.className = "danger";
  const close = document.createElement("button"); close.textContent = "close";
  prev.onclick = () => openLightbox(current - 1);
  next.onclick = () => openLightbox(current + 1);
  close.onclick = closeLightbox;
  edit.onclick = () => {
    const t = prompt("caption for this photo:", p.caption || "");
    if (t !== null) { p.caption = t.trim(); persist(); render(); renderGallery(); openLightbox(current); }
  };
  del.onclick = () => { const was = current; removePhoto(p.id); if (list.length) openLightbox(Math.min(was, list.length - 1)); else closeLightbox(); };
  bar.append(prev, next, edit, del, close);
  lightboxEl.append(img, cap, bar);
  if (list.length === 1) { prev.style.display = "none"; next.style.display = "none"; }
}
function closeLightbox() { if (lightboxEl) { lightboxEl.remove(); lightboxEl = null; } }

// ---------------- gallery ----------------
function ensureGallery() {
  if (galleryEl) return;
  galleryEl = document.createElement("div");
  galleryEl.className = "gallery";
  galleryEl.innerHTML = `
    <div class="gallery-head">
      <h2>our photo wall 📷</h2>
      <div class="acts">
        <button id="g-add">＋ add photos</button>
        <button id="g-close">close</button>
      </div>
    </div>
    <div class="gallery-grid" id="g-grid"></div>`;
  document.body.appendChild(galleryEl);
  galleryEl.querySelector("#g-close").onclick = closeGallery;
  galleryEl.querySelector("#g-add").onclick = () => {
    const inp = document.getElementById("photo-input");
    if (inp) { inp.onchange = async (e) => { await photos.addFiles(e.target.files); e.target.value = ""; }; inp.click(); }
  };
}
function renderGallery() {
  if (!galleryEl) return;
  const grid = galleryEl.querySelector("#g-grid");
  grid.innerHTML = "";
  if (!list.length) { grid.innerHTML = `<div class="g-empty">nothing up yet. add a photo and it'll appear here and on Blaze's wall.</div>`; return; }
  list.forEach((p, i) => {
    const c = document.createElement("div");
    c.className = "gcard";
    const img = document.createElement("img"); img.src = p.data; img.alt = p.caption || "";
    img.addEventListener("click", () => openLightbox(i));
    const cap = document.createElement("div"); cap.className = "cap"; cap.textContent = p.caption || "tap to add a caption";
    const rm = document.createElement("button"); rm.className = "rm"; rm.textContent = "×"; rm.title = "remove";
    rm.onclick = () => removePhoto(p.id);
    const edit = document.createElement("button"); edit.className = "edit"; edit.textContent = "✎"; edit.title = "caption";
    edit.onclick = () => { const t = prompt("caption for this photo:", p.caption || ""); if (t !== null) { p.caption = t.trim(); persist(); render(); renderGallery(); } };
    c.append(img, cap, rm, edit);
    grid.appendChild(c);
  });
}
function openGallery() { ensureGallery(); renderGallery(); galleryEl.style.display = "flex"; renderGallery(); }
function closeGallery() { if (galleryEl) galleryEl.style.display = "none"; }

function removePhoto(id) {
  const at = idx(id);
  if (at < 0) return;
  list.splice(at, 1);
  persist();
  render(); renderGallery();
  onChange(0, list.length, "remove");
}

export const photos = {
  init(el, callbacks = {}) {
    wallEl = el;
    onChange = callbacks.onChange || (() => {});
    onNote = callbacks.onNote || (() => {});
    render();
  },
  async addFiles(fileList) {
    const files = [...(fileList || [])].filter((f) => f && f.type && f.type.startsWith("image/"));
    if (!files.length) { onNote("those didn't look like photos, moon."); return 0; }
    let added = 0;
    for (const f of files) {
      if (list.length >= MAX_PHOTOS) { onNote(`that's a full wall (${MAX_PHOTOS}). remove a couple first?`); break; }
      try {
        const data = await downscale(f);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        list.push({ id, data, caption: "" });
        if (!persist()) { list.pop(); onNote("that photo was too big to keep on this device. try a smaller one."); break; }
        added++;
      } catch {}
    }
    render();
    if (galleryEl && galleryEl.style.display !== "none") renderGallery();
    if (added) onChange(added, list.length);
    return added;
  },
  openGallery,
  clear() { list = []; storage.removeItem(KEY); render(); renderGallery(); onChange(0, 0, "clear"); },
  count() { return list.length; },
};
