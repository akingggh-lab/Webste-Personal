const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "portofolioUASPPGJumahirV1";

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    showToast("Browser tidak mengizinkan penyimpanan. Silakan salin catatan sebagai cadangan.");
    return false;
  }
}
function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch { return null; }
}
function safeExternalLink(url) {
  const parsed = normalizeUrl(url);
  if (!parsed) {
    showToast("Masukkan tautan lengkap yang diawali https://");
    return null;
  }
  return parsed;
}

$("#year").textContent = new Date().getFullYear();

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "✕" : "☰";
});
$$(".nav-link").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}));
$("#printBtn").addEventListener("click", () => window.print());

function updateSavedDoc(key, url) {
  const anchor = $(`#open-${key}`);
  if (!anchor) return;
  anchor.href = url;
  anchor.hidden = false;
}
$$(".save-link").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.key;
    const input = $(`#${key}`);
    const url = safeExternalLink(input.value);
    if (!url) return;
    const data = readStore();
    data[key] = url;
    writeStore(data);
    updateSavedDoc(key, url);
    showToast("Tautan berhasil disimpan di browser ini.");
  });
});

function youtubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1).split("/")[0]}`;
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${u.pathname}`;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube-nocookie.com/embed/${u.pathname.split("/")[2]}`;
    }
  } catch {}
  return null;
}
$("#loadVideo").addEventListener("click", () => {
  const url = safeExternalLink($("#videoUrl").value);
  if (!url) return;
  const embed = youtubeEmbed(url);
  const iframe = $("#videoEmbed");
  const placeholder = $("#videoPlaceholder");
  const external = $("#openVideoExternal");
  if (embed) {
    iframe.src = embed;
    iframe.hidden = false;
    placeholder.hidden = true;
  } else {
    iframe.hidden = true;
    iframe.src = "";
    placeholder.hidden = false;
    placeholder.querySelector("strong").textContent = "Video siap dibuka";
    placeholder.querySelector("span").textContent = "Tautan video eksternal tersimpan di bawah.";
  }
  external.href = url;
  external.hidden = false;
  const data = readStore();
  data.videoUrl = url;
  writeStore(data);
  showToast(embed ? "Video YouTube ditampilkan." : "Tautan disimpan. Gunakan tombol buka video.");
});

function saveReflectionFields() {
  const data = readStore();
  $$("textarea[data-reflection]").forEach(area => data[area.dataset.reflection] = area.value);
  writeStore(data);
}
$("#saveReflections").addEventListener("click", () => {
  saveReflectionFields();
  showToast("Catatan refleksi tersimpan di browser ini.");
});
$$("textarea[data-reflection]").forEach(area => {
  area.addEventListener("change", saveReflectionFields);
});

$("#exportReflections").addEventListener("click", () => {
  saveReflectionFields();
  const data = readStore();
  const text = [
    "PORTOFOLIO UAS PPG — CATATAN REFLEKSI",
    "Nama: Jumahir, S.Pd.",
    "Sekolah: SMPN 2 Labuapi",
    "",
    "REFLEKSI SIKLUS 2",
    data.reflection2 || "(Belum diisi)",
    "",
    "REFLEKSI SIKLUS 3",
    data.reflection3 || "(Belum diisi)",
    "",
    "REFLEKSI SIKLUS 4",
    data.reflection4 || "(Belum diisi)",
    "",
    "TAUTAN DOKUMEN",
    `Siklus 2: ${data.doc2 || "(Belum ditambahkan)"}`,
    `Siklus 3: ${data.doc3 || "(Belum ditambahkan)"}`,
    `Rancangan terpilih: ${data.doc4 || "(Belum ditambahkan)"}`,
    `Video praktik: ${data.videoUrl || "(Belum ditambahkan)"}`
  ].join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Catatan_Refleksi_Portofolio_UAS_PPG.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("File catatan refleksi berhasil dibuat.");
});

// Restore locally saved links and reflections.
const saved = readStore();
["doc2", "doc3", "doc4"].forEach(key => {
  if (saved[key]) {
    $(`#${key}`).value = saved[key];
    updateSavedDoc(key, saved[key]);
  }
});
$$("textarea[data-reflection]").forEach(area => {
  area.value = saved[area.dataset.reflection] || "";
});
if (saved.videoUrl) {
  $("#videoUrl").value = saved.videoUrl;
  const external = $("#openVideoExternal");
  external.href = saved.videoUrl;
  external.hidden = false;
  const embed = youtubeEmbed(saved.videoUrl);
  if (embed) {
    $("#videoEmbed").src = embed;
    $("#videoEmbed").hidden = false;
    $("#videoPlaceholder").hidden = true;
  }
}

// Highlight the navigation item corresponding to the visible section.
if ("IntersectionObserver" in window) {
  const sections = $$("main section[id]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-link").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach(section => observer.observe(section));
}
