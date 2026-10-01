// Blaze — the photo wall.
// Photos are downscaled and kept in this browser's localStorage. Nothing is
// ever uploaded anywhere; they live on Jasmine's device only.

const KEY = "blaze.photos";
const MAX_DIM = 680;
const MAX_PHOTOS = 30;
const QUALITY = 0.72;

const storage = (typeof localStorage !== "undefined")
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let list = load();
let wallEl = null;
let onChange = () => {};
let onNote = () => {};
let lightbox = null;

function load() {
  try { const a = JSON.parse(storage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function persist() {
  try { storage.setItem(KEY, JSON.stringify(list)); return true; }
  catch (e) { return false; }   // over quota
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
  // stable little rotation per photo
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 9) - 4) * 0.9; // -3.6 .. 3.6 deg
}

function render() {
  if (!wallEl) return;
  wallEl.innerHTML = "";
  if (!list.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = "no photos yet 🌙<br>add some in ⚙ settings, or just drop them here";
    wallEl.appendChild(e);
    return;
  }
  for (const p of list) {
    const d = document.createElement("div");
    d.className = "photo";
    d.style.setProperty("--tilt", tiltFor(p.id) + "deg");
    const img = document.createElement("img");
    img.src = p.data;
    img.alt = "a photo on Blaze's wall";
    const rm = document.createElement("button");
    rm.className = "rm"; rm.textContent = "×"; rm.title = "remove";
    rm.addEventListener("click", (ev) => { ev.stopPropagation(); removePhoto(p.id); });
    d.appendChild(img); d.appendChild(rm);
    d.addEventListener("click", () => openLightbox(p.data));
    wallEl.appendChild(d);
  }
}

function openLightbox(data) {
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.addEventListener("click", () => { lightbox.remove(); lightbox = null; });
    document.body.appendChild(lightbox);
  }
  lightbox.innerHTML = "";
  const img = document.createElement("img");
  img.src = data;
  lightbox.appendChild(img);
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
      if (list.length >= MAX_PHOTOS) { onNote(`that's a full wall (${MAX_PHOTOS} photos). remove one first?`); break; }
      try {
        const data = await downscale(f);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        list.push({ id, data });
        if (!persist()) { list.pop(); onNote("that photo was too big to keep on this device. try a smaller one."); break; }
        added++;
      } catch { /* skip bad file */ }
    }
    render();
    if (added) onChange(added, list.length);
    return added;
  },

  removePhoto(id) { removePhoto(id); },
  clear() {
    list = [];
    storage.removeItem(KEY);
    render();
    onChange(0, 0, "clear");
  },
  count() { return list.length; },
};

function removePhoto(id) {
  list = list.filter((p) => p.id !== id);
  persist();
  render();
  onChange(0, list.length, "remove");
}
