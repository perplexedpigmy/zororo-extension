const HOSTS = ["https://ororo.tv/*"];
const WATCHED_KEY = "watched";
let activeTab = "queue";

function starsHTML(rating) {
  return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
}

async function checkPermission() {
  return new Promise((resolve) => {
    chrome.permissions.contains({ origins: HOSTS }, resolve);
  });
}

async function requestPermission() {
  return new Promise((resolve) => {
    chrome.permissions.request({ origins: HOSTS }, resolve);
  });
}

async function init() {
  const permLoading = document.getElementById("permission-loading");
  const permRequired = document.getElementById("permission-required");
  const tabQueue = document.getElementById("tab-queue");
  const tabWatched = document.getElementById("tab-watched");

  const granted = await checkPermission();
  permLoading.style.display = "none";

  if (!granted) {
    permRequired.style.display = "block";
    return;
  }

  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      document.getElementById("tab-" + activeTab).classList.add("active");
      if (activeTab === "watched") renderWatched();
    };
  });

  tabQueue.classList.add("active");
  render();
  setInterval(render, 2000);
}

document.getElementById("grant-permission").onclick = async () => {
  const btn = document.getElementById("grant-permission");
  btn.disabled = true;
  btn.textContent = "Requesting...";
  const granted = await requestPermission();
  if (granted) {
    document.getElementById("permission-required").style.display = "none";
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    document.querySelector('[data-tab="queue"]').classList.add("active");
    document.getElementById("tab-queue").classList.add("active");
    render();
    setInterval(render, 2000);
  } else {
    btn.disabled = false;
    btn.textContent = "Grant Access";
  }
};

function createItemElement(item) {
  const seasonStr = "s" + String(item.season).padStart(2, "0");
  const epStr = item.episodeNum + ". " + item.episodeName;

  const div = document.createElement("div");
  div.className = "item";

  const info = document.createElement("div");
  info.className = "info";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = seasonStr + " \u00b7 " + epStr;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = item.showName;

  info.appendChild(name);
  info.appendChild(meta);

  const badge = document.createElement("span");
  badge.className = "status-badge status-" + item.status;
  badge.textContent = item.status;

  div.appendChild(info);
  div.appendChild(badge);
  return div;
}

async function render() {
  const resp = await chrome.runtime.sendMessage({ type: "get-queue" });
  const queue = resp?.queue || [];
  const listEl = document.getElementById("list");
  const summaryEl = document.getElementById("summary");
  const cancelBtn = document.getElementById("cancel-all");

  listEl.replaceChildren();

  if (queue.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.appendChild(document.createTextNode("No active downloads."));
    empty.appendChild(document.createElement("br"));
    empty.appendChild(document.createTextNode("Open a show on ororo.tv to start."));
    listEl.appendChild(empty);
    summaryEl.textContent = "";
    cancelBtn.style.display = "none";
    return;
  }

  const counts = { queued: 0, downloading: 0, completed: 0, failed: 0, cancelled: 0 };
  for (const item of queue) counts[item.status]++;

  summaryEl.textContent =
    counts.completed + " done \u00b7 " + counts.downloading +
    " downloading \u00b7 " + counts.queued + " queued \u00b7 " + counts.failed + " failed";

  cancelBtn.style.display = counts.queued > 0 ? "block" : "none";

  const fragment = document.createDocumentFragment();
  const items = queue.slice().reverse().slice(0, 50);
  for (const item of items) {
    fragment.appendChild(createItemElement(item));
  }
  listEl.appendChild(fragment);
}

async function renderWatched() {
  const data = await chrome.storage.local.get(WATCHED_KEY);
  const watched = data[WATCHED_KEY] || [];
  const listEl = document.getElementById("watched-list");
  listEl.replaceChildren();

  if (watched.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.appendChild(document.createTextNode("No rated items yet."));
    empty.appendChild(document.createElement("br"));
    empty.appendChild(document.createTextNode("Rate a show or movie to see it here."));
    listEl.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  const sorted = watched.slice().reverse();

  for (const item of sorted) {
    const div = document.createElement("div");
    div.className = "item watched-item";

    const badge = document.createElement("span");
    badge.className = "type-badge type-" + item.type;
    badge.textContent = item.type;

    const info = document.createElement("div");
    info.className = "info";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = item.title;

    const date = document.createElement("div");
    date.className = "watched-date";
    date.textContent = new Date(item.dateWatched).toLocaleDateString();

    info.appendChild(name);
    info.appendChild(date);

    const stars = document.createElement("span");
    stars.className = "stars";
    stars.textContent = starsHTML(item.rating || 0);

    const delBtn = document.createElement("button");
    delBtn.className = "del-btn";
    delBtn.textContent = "\u2715";
    delBtn.onclick = async () => {
      const watched2 = (await chrome.storage.local.get(WATCHED_KEY))[WATCHED_KEY] || [];
      const filtered = watched2.filter((w) => w.id !== item.id);
      await chrome.storage.local.set({ [WATCHED_KEY]: filtered });
      renderWatched();
    };

    div.appendChild(badge);
    div.appendChild(info);
    div.appendChild(stars);
    div.appendChild(delBtn);
    fragment.appendChild(div);
  }

  listEl.appendChild(fragment);
}

document.getElementById("cancel-all").onclick = async () => {
  await chrome.runtime.sendMessage({ type: "cancel-all" });
  render();
};

document.getElementById("open-options").onclick = () => {
  chrome.runtime.openOptionsPage();
};

init();
