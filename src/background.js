const CONCURRENCY = 3;
const STORAGE_KEY = "queue";

let queue = [];
let activeCount = 0;
let processing = false;

async function loadQueue() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  queue = data[STORAGE_KEY] || [];
}

async function saveQueue() {
  await chrome.storage.local.set({ [STORAGE_KEY]: queue });
}

function broadcast() {
  chrome.runtime.sendMessage({ type: "queue-update", queue }).catch(() => {});
}

async function getConfig() {
  const defaults = { rootDir: "OroroTV", subtitleLangs: ["en"], defaultSubLang: "en" };
  const data = await chrome.storage.sync.get(Object.keys(defaults));
  return { ...defaults, ...data };
}

function safePath(str) {
  return str.replace(/[<>:"/\\|?*]+/g, "").trim();
}

async function processNext() {
  await loadQueue();
  if (processing) return;
  processing = true;

  while (activeCount < CONCURRENCY) {
    const item = queue.find((e) => e.status === "queued");
    if (!item) break;

    activeCount++;
    item.status = "downloading";
    await saveQueue();
    broadcast();

    processItem(item).finally(() => {
      activeCount--;
      saveQueue().then(broadcast);
    });
  }

  processing = false;
}

async function processItem(item) {
  try {
    const config = await getConfig();
    const base = `${config.rootDir}/${safePath(item.showName)}/s${String(item.season).padStart(2, "0")}`;
    const epFile = `${base}/${String(item.episodeNum).padStart(2, "0")}.${safePath(item.episodeName || "Episode")}`;

    await chrome.downloads.download({
      url: item.downloadUrl,
      filename: `${epFile}.mp4`,
      conflictAction: "uniquify",
      saveAs: false,
    });

    const wantedLangs = config.subtitleLangs || ["en"];
    const defaultLang = config.defaultSubLang || wantedLangs[0];
    for (const sub of (item.subtitles || []).filter((s) => wantedLangs.includes(s.lang))) {
      try {
        const suffix = sub.lang === defaultLang ? "" : "." + sub.lang;
        await chrome.downloads.download({
          url: sub.url,
          filename: `${epFile}${suffix}.srt`,
          conflictAction: "uniquify",
          saveAs: false,
        });
      } catch {
        // subtitle failure is non-fatal
      }
    }

    item.status = "completed";
  } catch (err) {
    item.status = "failed";
    item.error = err.message;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "start-download":
      (async () => {
        const config = await getConfig();
        const bySeason = {};
        for (const ep of msg.episodes) {
          if (!bySeason[ep.season]) bySeason[ep.season] = [];
          bySeason[ep.season].push(ep);
        }

        const onDisk = new Set();
        for (const seasonStr of Object.keys(bySeason)) {
          const prefix = `${config.rootDir}/${safePath(msg.showName)}/s${String(parseInt(seasonStr, 10)).padStart(2, "0")}/`;
          const results = await chrome.downloads.search({ filename: prefix });
          for (const r of results) {
            if (r.state === "complete" && r.exists !== false) {
              const m = r.filename.match(/\/(\d+)\./);
              if (m) onDisk.add(parseInt(m[1], 10));
            }
          }
        }

        let queuedCount = 0;
        let skippedCount = 0;
        for (const ep of msg.episodes) {
          if (onDisk.has(ep.number)) {
            skippedCount++;
            continue;
          }
          const exists = queue.some(
            (q) =>
              q.showName === msg.showName &&
              q.downloadUrl === ep.downloadUrl &&
              (q.status === "queued" || q.status === "downloading")
          );
          if (!exists) {
            queue.push({
              showName: msg.showName,
              season: ep.season,
              episodeNum: ep.number,
              episodeName: ep.name || `Episode ${ep.number}`,
              downloadUrl: ep.downloadUrl,
              subtitles: ep.subtitles || [],
              status: "queued",
            });
            queuedCount++;
          }
        }

        if (queuedCount > 0) {
          await saveQueue();
          broadcast();
          processNext();
        }
        sendResponse({ ok: true, queued: queuedCount, skipped: skippedCount });
      })();
      return true;

    case "get-queue":
      loadQueue().then(() => sendResponse({ queue }));
      return true;

    case "cancel-all":
      queue = queue.map((e) =>
        e.status === "queued" ? { ...e, status: "cancelled" } : e
      );
      saveQueue().then(broadcast);
      sendResponse({ ok: true });
      break;
  }
});

chrome.downloads.onChanged.addListener(() => {
  processNext();
});

chrome.alarms.create("queue-watch", { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "queue-watch") processNext();
});
