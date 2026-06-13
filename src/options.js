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

document.addEventListener("DOMContentLoaded", load);
document.getElementById("save").addEventListener("click", save);
