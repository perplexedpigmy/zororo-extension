const DEFAULTS = {
  rootDir: "OroroTV",
  subtitleLangs: ["en"],
};

async function load() {
  const data = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const config = { ...DEFAULTS, ...data };

  document.getElementById("rootDir").value = config.rootDir;

  const checked = config.subtitleLangs || [];
  document.querySelectorAll("#subLangs input[type='checkbox']").forEach((cb) => {
    cb.checked = checked.includes(cb.value);
  });
}

async function save() {
  const rootDir = document.getElementById("rootDir").value.trim() || DEFAULTS.rootDir;
  const subtitleLangs = Array.from(
    document.querySelectorAll("#subLangs input[type='checkbox']:checked")
  ).map((cb) => cb.value);

  await chrome.storage.sync.set({ rootDir, subtitleLangs });

  const status = document.getElementById("status");
  status.textContent = "Saved.";
  setTimeout(() => (status.textContent = ""), 2000);
}

async function exportWatched() {
  const data = await chrome.storage.local.get("watched");
  const json = JSON.stringify(data.watched || [], null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ororo-watched-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importWatched(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Not an array");
    for (const item of data) {
      if (!item.id) throw new Error("Item missing 'id' field");
    }
    await chrome.storage.local.set({ watched: data });
    const status = document.getElementById("io-status");
    status.textContent = "Imported " + data.length + " watched items.";
    setTimeout(() => (status.textContent = ""), 3000);
  } catch (err) {
    document.getElementById("io-status").textContent = "Import failed: " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", load);
document.getElementById("save").addEventListener("click", save);
document.getElementById("export-btn").addEventListener("click", exportWatched);
document.getElementById("import-btn").addEventListener("click", () =>
  document.getElementById("import-file").click()
);
document.getElementById("import-file").addEventListener("change", (e) => {
  if (e.target.files.length > 0) importWatched(e.target.files[0]);
  e.target.value = "";
});
