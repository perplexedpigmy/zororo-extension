(() => {
  const WATCHED_KEY = "watched";

  const path = window.location.pathname;
  const showMatch = path.match(/\/[a-z]{2}\/shows\/(.+)/);
  const movieMatch = path.match(/\/[a-z]{2}\/movies\/(.+)/);
  const isShow = !!showMatch;
  const isMovie = !!movieMatch;
  const isContentPage = isShow || isMovie;
  const slug = isContentPage ? (isShow ? showMatch[1] : movieMatch[1]).replace(/\/$/, "") : null;

  let showId = null;
  let showName = null;
  let episodes = [];
  let seasons = [];
  let posterUrl = null;

  async function loadWatched() {
    const data = await chrome.storage.local.get(WATCHED_KEY);
    return data[WATCHED_KEY] || [];
  }

  async function saveWatchedItem(item) {
    const watched = await loadWatched();
    const idx = watched.findIndex((w) => w.id === item.id);
    if (idx >= 0) {
      watched[idx] = item;
    } else {
      watched.push(item);
    }
    await chrome.storage.local.set({ [WATCHED_KEY]: watched });
  }

  async function removeWatchedItem(id) {
    const watched = await loadWatched();
    const filtered = watched.filter((w) => w.id !== id);
    await chrome.storage.local.set({ [WATCHED_KEY]: filtered });
  }

  // ====== STAR DROPDOWN INJECTION ======

  function initDropdownInjection() {
    const inject = () => {
      const tabList = document.querySelector("ul.favorites-tabs-list");
      const content = document.querySelector(".favorites-content");
      if (tabList && content && !document.getElementById("ororo-watched-tab")) {
        injectWatchedTab(tabList, content);
      }
    };
    inject();
    const obs = new MutationObserver(inject);
    obs.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".hot-icon")) {
        setTimeout(() => {
          const panel = document.querySelector(".ororo-watched-panel");
          if (panel && panel.style.display !== "none") {
            renderWatchedDropdown(panel);
          }
        }, 100);
      }
    });
  }

  function injectWatchedTab(tabList, content) {
    const li = document.createElement("li");
    li.className = "favorites-tabs-item";
    li.id = "ororo-watched-tab";
    const btn = document.createElement("button");
    btn.className = "favorites-tabs-control";
    btn.type = "button";
    btn.textContent = "Rated";
    li.appendChild(btn);
    tabList.appendChild(li);

    const panel = document.createElement("div");
    panel.className = "favorites-content-item ororo-watched-panel";
    panel.style.display = "none";
    content.appendChild(panel);

    const list = document.createElement("div");
    list.className = "favorites-list";
    panel.appendChild(list);

    const foot = document.createElement("div");
    foot.className = "favorites-foot";
    const removeArea = document.createElement("div");
    removeArea.className = "favorites-remove";
    const markArea = document.createElement("div");
    markArea.className = "favorites-mark";
    const editLink = document.createElement("a");
    editLink.className = "js-fav-edit";
    editLink.href = "#";
    editLink.textContent = "Edit";
    editLink.onclick = (e) => {
      e.preventDefault();
      panel.classList.toggle("editing");
      editLink.textContent = panel.classList.contains("editing") ? "Done" : "Edit";
    };
    markArea.appendChild(editLink);
    foot.appendChild(removeArea);
    foot.appendChild(markArea);
    panel.appendChild(foot);

    function deactivateWatched() {
      li.classList.remove("active");
      panel.style.display = "none";
    }

    btn.onclick = () => {
      tabList.querySelectorAll(".favorites-tabs-item").forEach((t) => t.classList.remove("active"));
      li.classList.add("active");
      content.querySelectorAll(".favorites-content-item").forEach((p) => { p.style.display = "none"; });
      panel.style.display = "block";
      renderWatchedDropdown(panel);
    };

    tabList.querySelectorAll(".favorites-tabs-control:not(#ororo-watched-tab button)").forEach((existingBtn) => {
      existingBtn.addEventListener("click", deactivateWatched);
    });
  }

  async function renderWatchedDropdown(panel) {
    const watched = await loadWatched();
    const list = panel.querySelector(".favorites-list");
    list.replaceChildren();

    if (watched.length === 0) {
      const note = document.createElement("div");
      note.className = "favorites-note";
      const p = document.createElement("p");
      p.className = "favorites-note-text";
      p.textContent = "No rated items yet. Rate a show or movie to see it here.";
      note.appendChild(p);
      list.appendChild(note);
      return;
    }

    const sorted = watched.slice().reverse();
    for (const item of sorted) {
      const div = document.createElement("div");
      div.className = "favorites-item movie";

      // Poster / icon
      const iconDiv = document.createElement("div");
      iconDiv.className = "movie-icon";
      const primaryDiv = document.createElement("div");
      primaryDiv.className = "movie-icon-primary";
      const link = document.createElement("a");
      link.href = item.url || "/" + path.split("/")[1] + "/" + item.type + "s/" + item.slug;
      if (item.posterUrl) {
        const img = document.createElement("img");
        img.className = "lazy";
        img.src = item.posterUrl;
        img.style.cssText = "width:100%;height:auto;border-radius:4px;";
        link.appendChild(img);
      } else {
        link.textContent = "\uD83C\uDFAC";
        link.style.cssText = "width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:#1a1a3e;border-radius:4px;font-size:20px;";
      }
      primaryDiv.appendChild(link);
      iconDiv.appendChild(primaryDiv);
      div.appendChild(iconDiv);

      // Info
      const info = document.createElement("a");
      info.className = "movie-info";
      info.href = item.url || "/" + path.split("/")[1] + "/" + item.type + "s/" + item.slug;
      const title = document.createElement("p");
      title.className = "movie-title";
      title.textContent = item.title;
      info.appendChild(title);
      const desc = document.createElement("p");
      desc.className = "movie-description";
      const starSpan = document.createElement("span");
      starSpan.style.color = "#ffd700";
      starSpan.textContent = "\u2605".repeat(item.rating || 0) + "\u2606".repeat(5 - (item.rating || 0));
      desc.appendChild(starSpan);
      desc.appendChild(document.createTextNode(" \u00b7 " + new Date(item.dateWatched).toLocaleDateString()));
      info.appendChild(desc);
      div.appendChild(info);

      // Type badge + Remove button
      const other = document.createElement("div");
      other.className = "movie-other";
      const badge = document.createElement("span");
      badge.style.cssText = "color:" + (item.type === "movie" ? "#00b894" : "#6c5ce7") +
        "; font-size:10px; font-weight:600; text-transform:uppercase;";
      badge.textContent = item.type === "movie" ? "MOVIE" : "SHOW";
      other.appendChild(badge);

      const delBtn = document.createElement("a");
      delBtn.className = "movie-btn remove";
      delBtn.href = "#";
      delBtn.textContent = "Remove";
      delBtn.style.display = "none";
      delBtn.onclick = (e) => {
        e.preventDefault();
        removeWatchedItem(item.id).then(() => renderWatchedDropdown(panel));
      };
      other.appendChild(delBtn);

      div.appendChild(other);
      list.appendChild(div);
    }
  }

  // ====== PANEL UI (show/movie pages only) ======

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function getConfig() {
    const defaults = { rootDir: "OroroTV" };
    return new Promise((r) => chrome.storage.sync.get(defaults, r));
  }

  function tryGetPoster() {
    const img = document.querySelector('img#poster, img[src*="/uploads/show/poster/"], img[data-src*="/uploads/show/poster/"]');
    if (img) return img.getAttribute("src") || img.getAttribute("data-src") || null;
    return null;
  }

  function tryGetPosterFromData(data) {
    if (!data || typeof data !== "object") return null;
    for (const key of ["poster_url", "poster", "image", "poster_thumb", "thumbnail"]) {
      if (typeof data[key] === "string" && data[key].length > 0) return data[key];
    }
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const found = tryGetPosterFromData(val);
        if (found) return found;
      }
    }
    return null;
  }

  function getLangPrefix() {
    const m = path.match(/^\/([a-z]{2})\//);
    return m ? m[1] : "en";
  }

  if (isShow || isMovie) {
    initContentPanel();
  }

  async function initContentPanel() {
    const config = await getConfig();
    const lang = getLangPrefix();

    const panel = document.createElement("div");
    panel.id = "ororo-dl-panel";
    panel.innerHTML =
      '<button class="close-btn" id="ororo-dl-close">&times;</button>' +
      '<h2 id="ororo-dl-title">zororo</h2>' +
      '<p class="subtitle" id="ororo-dl-subtitle">Loading...</p>' +
      '<div id="ororo-dl-watched" class="watched-section"></div>' +
      '<div id="ororo-dl-body"></div>' +
      '<div class="status-bar" id="ororo-dl-status"></div>' +
      '<div class="error-msg" id="ororo-dl-error"></div>';
    document.body.appendChild(panel);

    const titleEl = document.getElementById("ororo-dl-title");
    const subEl = document.getElementById("ororo-dl-subtitle");
    const bodyEl = document.getElementById("ororo-dl-body");
    const watchedEl = document.getElementById("ororo-dl-watched");
    const statusBar = document.getElementById("ororo-dl-status");
    const errorEl = document.getElementById("ororo-dl-error");

    document.getElementById("ororo-dl-close").onclick = () => panel.remove();

    if (isMovie) {
      await initMovie(titleEl, subEl, bodyEl, watchedEl, statusBar, errorEl);
    } else {
      await initShow(titleEl, subEl, bodyEl, watchedEl, statusBar, errorEl);
    }
  }

  async function initShow(titleEl, subEl, bodyEl, watchedEl, statusBar, errorEl) {
    try {
      const resp = await fetch("/api/v2/shows", { credentials: "include" });
      if (!resp.ok) {
        if (resp.status === 401) throw new Error("AUTH_FAILED");
        if (resp.status === 402) throw new Error("FREE_LIMIT");
        throw new Error("API_" + resp.status);
      }
      const data = await resp.json();
      const shows = data.shows || [];
      const show = shows.find((s) => slugify(s.name) === slug) || shows[0];
      if (!show) throw new Error("SHOW_NOT_FOUND");
      showId = show.id;
      showName = show.name;

      posterUrl = show.poster_url || show.poster || show.image || show.thumbnail || tryGetPoster();

      titleEl.textContent = showName;

      const detail = await fetch("/api/v2/shows/" + showId, { credentials: "include" });
      if (!detail.ok) throw new Error("API_" + detail.status);
      const showData = await detail.json();

      if (!posterUrl) posterUrl = tryGetPosterFromData(showData);
      if (!posterUrl) posterUrl = tryGetPoster();

      episodes = showData.episodes || [];
      const seasonSet = new Set(episodes.map((e) => e.season));
      seasons = Array.from(seasonSet).sort((a, b) => a - b);

      subEl.textContent = episodes.length + " episodes \u00b7 " + seasons.length + " seasons";
      renderDownloadSection(bodyEl, titleEl, subEl, statusBar, errorEl);

      const watched = await loadWatched();
      const entry = watched.find((w) => w.id === "show_" + showId);
      buildWatchedSection(watchedEl, "show_" + showId, showName, entry || null);
    } catch (err) {
      const msgs = {
        AUTH_FAILED: "Not logged in. Sign in to ororo.tv first.",
        FREE_LIMIT: "Free limit reached. Upgrade your plan to download.",
        SHOW_NOT_FOUND: "Could not find this show. Try reloading."
      };
      errorEl.textContent = msgs[err.message] || "Failed to load: " + err.message;
      errorEl.classList.add("visible");
      subEl.textContent = "Failed to load show data";
    }
  }

  async function initMovie(titleEl, subEl, bodyEl, watchedEl, statusBar, errorEl) {
    try {
      const resp = await fetch("/api/v2/shows", { credentials: "include" });
      if (!resp.ok) {
        if (resp.status === 401) throw new Error("AUTH_FAILED");
        if (resp.status === 402) throw new Error("FREE_LIMIT");
        throw new Error("API_" + resp.status);
      }
      const data = await resp.json();
      const shows = data.shows || [];
      const movie = shows.find((s) => slugify(s.name) === slug);
      if (movie) {
        showId = movie.id;
        showName = movie.name;

        posterUrl = movie.poster_url || movie.poster || movie.image || movie.thumbnail || tryGetPoster();

        titleEl.textContent = showName;

        const detail = await fetch("/api/v2/shows/" + showId, { credentials: "include" });
        if (!detail.ok) throw new Error("API_" + detail.status);
        const showData = await detail.json();

        if (!posterUrl) posterUrl = tryGetPosterFromData(showData);
        if (!posterUrl) posterUrl = tryGetPoster();
      }
    } catch (err) {
      const msgs = {
        AUTH_FAILED: "Not logged in. Sign in to ororo.tv first.",
        FREE_LIMIT: "Free limit reached. Upgrade your plan to download."
      };
      errorEl.textContent = msgs[err.message] || "Failed to load: " + err.message;
      errorEl.classList.add("visible");
      subEl.textContent = "Failed to load movie data";
      return;
    }

    if (!showName) {
      showName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      showId = slug;
      if (!posterUrl) posterUrl = tryGetPoster();
    }

    titleEl.textContent = showName;
    subEl.textContent = "Movie";
    bodyEl.style.display = "none";

    const watched = await loadWatched();
    const entry = watched.find((w) => w.id === "movie_" + showId);
    buildWatchedSection(watchedEl, "movie_" + showId, showName, entry || null);
  }

  function buildWatchedSection(watchedEl, id, title, entry, poster) {
    watchedEl.replaceChildren();

    const stars = document.createElement("span");
    stars.className = "star-rating";
    let currentRating = entry ? entry.rating : 0;

    async function handleStarClick(i) {
      currentRating = currentRating === i ? 0 : i;
      renderStars(currentRating);
      if (currentRating > 0) {
        const item = {
          id: id,
          type: isMovie ? "movie" : "show",
          title: title,
          slug: slug,
          url: window.location.pathname,
          rating: currentRating,
          dateWatched: new Date().toISOString(),
        };
        const p = poster || posterUrl || tryGetPoster();
        if (p) item.posterUrl = p;
        await saveWatchedItem(item);
      } else {
        await removeWatchedItem(id);
      }
    }

    function renderStars(rating) {
      stars.replaceChildren();
      const label = document.createElement("span");
      label.className = "watched-label";
      label.textContent = rating > 0 ? "Rated" : "Rate";
      stars.appendChild(label);
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement("span");
        s.className = "star" + (i <= rating ? " filled" : "");
        s.textContent = "\u2605";
        s.dataset.value = String(i);
        s.onmouseenter = () => {
          for (const child of stars.children) {
            if (child.dataset && child.dataset.value) {
              child.classList.toggle("hover", Number(child.dataset.value) <= i);
            }
          }
        };
        s.onclick = () => handleStarClick(i);
        stars.appendChild(s);
      }
      stars.onmouseleave = () => {
        for (const child of stars.children) {
          child.classList.remove("hover");
        }
      };
    }
    renderStars(currentRating);

    watchedEl.appendChild(stars);
  }

  function renderDownloadSection(bodyEl, titleEl, subEl, statusBar, errorEl) {
    const old = document.getElementById("ororo-dl-download");
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.id = "ororo-dl-download";

    const seasDiv = document.createElement("div");
    seasDiv.id = "ororo-dl-seasons";
    wrap.appendChild(seasDiv);

    const actions1 = document.createElement("div");
    actions1.className = "actions";
    const goBtn = document.createElement("button");
    goBtn.className = "btn-download";
    goBtn.id = "ororo-dl-go";
    goBtn.textContent = "Download Selected";
    actions1.appendChild(goBtn);
    wrap.appendChild(actions1);

    const actions2 = document.createElement("div");
    actions2.className = "actions";
    const selBtn = document.createElement("button");
    selBtn.className = "btn-select-all";
    selBtn.id = "ororo-dl-select-all";
    selBtn.textContent = "Select All";
    const deselBtn = document.createElement("button");
    deselBtn.className = "btn-deselect-all";
    deselBtn.id = "ororo-dl-deselect-all";
    deselBtn.textContent = "Clear";
    actions2.appendChild(selBtn);
    actions2.appendChild(deselBtn);
    wrap.appendChild(actions2);

    bodyEl.appendChild(wrap);

    // Render seasons
    const seasonsEl = document.getElementById("ororo-dl-seasons");
    seasonsEl.replaceChildren();
    for (const s of seasons) {
      const eps = episodes.filter((e) => e.season === s);
      const tab = document.getElementById(String(s));
      let released = eps.length;
      let upcoming = 0;
      if (tab) {
        upcoming = tab.querySelectorAll(".show-content__upcoming-episode").length;
      }
      const total = released + upcoming;
      const incomplete = upcoming > 0;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "ororo-dl-season-cb";
      cb.dataset.season = String(s);
      cb.checked = !incomplete;
      const span = document.createElement("span");
      span.textContent = "Season " + s;
      const count = document.createElement("span");
      count.className = "season-count";
      count.textContent = incomplete ? released + " of " + total + " ep." : total + " ep.";
      const label = document.createElement("label");
      label.appendChild(cb);
      label.appendChild(span);
      label.appendChild(count);
      if (incomplete) {
        const badge = document.createElement("span");
        badge.className = "season-missing";
        badge.textContent = upcoming + " missing";
        label.appendChild(badge);
      }
      const div = document.createElement("div");
      div.className = "season-group" + (incomplete ? " incomplete" : "");
      div.appendChild(label);
      seasonsEl.appendChild(div);
    }

    selBtn.onclick = () => {
      document.querySelectorAll(".ororo-dl-season-cb").forEach((c) => (c.checked = true));
    };
    deselBtn.onclick = () => {
      document.querySelectorAll(".ororo-dl-season-cb").forEach((c) => (c.checked = false));
    };

    goBtn.onclick = async () => {
      const selected = Array.from(document.querySelectorAll(".ororo-dl-season-cb:checked"))
        .map((cb) => parseInt(cb.dataset.season, 10));
      if (selected.length === 0) {
        errorEl.textContent = "Select at least one season.";
        errorEl.classList.add("visible");
        return;
      }

      errorEl.classList.remove("visible");
      goBtn.disabled = true;
      goBtn.textContent = "Resolving episode links...";

      const epsToDl = episodes.filter((e) => selected.includes(e.season));
      const resolved = [];

      for (let i = 0; i < epsToDl.length; i++) {
        statusBar.textContent = "Resolving " + (i + 1) + " of " + epsToDl.length + "...";
        statusBar.classList.add("visible");
        try {
          const item = await resolveEpisode(epsToDl[i]);
          if (item.downloadUrl) resolved.push(item);
        } catch (err) {
          errorEl.textContent = "" + err.message;
          errorEl.classList.add("visible");
        }
      }

      if (resolved.length === 0) {
        errorEl.textContent = "Could not resolve any episode URLs.";
        errorEl.classList.add("visible");
        goBtn.disabled = false;
        goBtn.textContent = "Download Selected";
        statusBar.classList.remove("visible");
        return;
      }

      goBtn.textContent = "Checking for existing downloads...";

      chrome.runtime.sendMessage(
        { type: "start-download", showName: showName, episodes: resolved },
        (resp) => {
          if (chrome.runtime.lastError) {
            errorEl.textContent = "Extension error. Check console or reload.";
            errorEl.classList.add("visible");
          } else if (resp.queued === 0) {
            statusBar.textContent = "All episodes already downloaded.";
            statusBar.classList.add("visible");
          } else {
            const parts = ["Queued " + resp.queued + " episode(s)."];
            if (resp.skipped > 0) parts.push("Skipped " + resp.skipped + " (already on disk).");
            statusBar.textContent = parts.join(" ");
            statusBar.classList.add("visible");
          }
          goBtn.disabled = false;
          goBtn.textContent = "Download Selected";
        }
      );
    };
  }

  async function resolveEpisode(ep) {
    const resp = await fetch("/api/v2/episodes/" + ep.id, { credentials: "include" });
    if (!resp.ok) throw new Error("Failed to resolve episode " + ep.id + ": HTTP " + resp.status);
    const data = await resp.json();
    return {
      showName: showName,
      season: ep.season,
      number: ep.number,
      name: ep.name,
      downloadUrl: data.download_url,
      subtitles: (data.subtitles || []).map((s) => ({
        lang: s.lang,
        url: s.url.startsWith("http") ? s.url : "https://ororo.tv" + s.url,
      })),
    };
  }

  // Always inject into star dropdown
  initDropdownInjection();
})();
