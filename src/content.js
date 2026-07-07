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
    btn.textContent = t("ratedTab");
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
    editLink.textContent = t("edit");
    editLink.onclick = (e) => {
      e.preventDefault();
      panel.classList.toggle("editing");
      editLink.textContent = panel.classList.contains("editing") ? t("done") : t("edit");
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
      p.textContent = t("ratedEmpty");
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
      delBtn.textContent = t("remove");
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

  const COINS = [
    { id: "btc", name: "BTC", symbol: "₿", color: "#f7931a", address: "bc1qgyffnlhp2uz2uhpmhfrspc5qxpj3y9m4lwgga5" },
    { id: "eth", name: "ETH", svg: '<svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 28,16 16,30 4,16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><polygon points="16,2 16,30 4,16" fill="#fff" opacity="0.35"/></svg>', color: "#627eea", address: "0x581b4810873698505FDF3aAf0a39430bb0D7d655" },
    { id: "sol", name: "SOL", svg: '<svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><line x1="6" y1="9" x2="26" y2="9" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><line x1="6" y1="16" x2="26" y2="16" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><line x1="6" y1="23" x2="26" y2="23" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>', color: "#9945ff", address: "6awadeXmfc7JUMQL5SEgZXDE4yaFDgWkPNRySLDDmh7E" },
  ];

  function buildDonateModal() {
    const modal = document.getElementById("ororo-dl-donate-modal");
    modal.replaceChildren();

    const backBtn = document.createElement("button");
    backBtn.className = "donate-back";
    backBtn.textContent = "← " + t("back");
    backBtn.onclick = () => { modal.closest("#ororo-dl-panel").classList.remove("donate-open"); };
    modal.appendChild(backBtn);

    const h = document.createElement("h3");
    h.className = "donate-heading";
    h.textContent = "❤️ " + t("support") + " Zororo";
    modal.appendChild(h);

    const coffee = document.createElement("div");
    coffee.className = "donate-section";
    const cl = document.createElement("a");
    cl.href = "https://www.buymeacoffee.com/pipolarbear";
    cl.target = "_blank";
    cl.className = "coffee-btn";
    cl.textContent = "☕ Buy me a coffee";
    coffee.appendChild(cl);
    modal.appendChild(coffee);

    const crypto = document.createElement("div");
    crypto.className = "donate-section";
    const crt = document.createElement("h4");
    crt.className = "donate-section-title";
    crt.textContent = "Cryptocurrency";
    crypto.appendChild(crt);

    const grid = document.createElement("div");
    grid.className = "crypto-grid";

    for (const coin of COINS) {
      const card = document.createElement("div");
      card.className = "crypto-card";
      const fc = document.createElement("div");
      fc.className = "coin-circle";
      fc.style.background = coin.color;
      fc.textContent = coin.symbol;
      if (coin.svg) fc.innerHTML = coin.svg;
      card.appendChild(fc);
      const fl = document.createElement("span");
      fl.className = "coin-label";
      fl.textContent = coin.name;
      card.appendChild(fl);
      card.onclick = () => showCryptoOverlay(coin);
      grid.appendChild(card);
    }

    crypto.appendChild(grid);
    modal.appendChild(crypto);
  }

  function showCryptoOverlay(coin) {
    const overlay = document.createElement("div");
    overlay.id = "ororo-crypto-overlay";

    const modal = document.createElement("div");
    modal.className = "crypto-modal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "crypto-modal-close";
    closeBtn.textContent = "✕";
    closeBtn.onclick = () => overlay.remove();
    modal.appendChild(closeBtn);

    const heading = document.createElement("div");
    heading.className = "crypto-modal-heading";
    const hc = document.createElement("span");
    hc.className = "coin-circle";
    hc.style.background = coin.color;
    hc.textContent = coin.symbol;
    if (coin.svg) hc.innerHTML = coin.svg;
    heading.appendChild(hc);
    const hl = document.createElement("span");
    hl.textContent = coin.name;
    heading.appendChild(hl);
    modal.appendChild(heading);

    const qr = document.createElement("img");
    qr.className = "crypto-modal-qr";
    qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(coin.address);
    qr.alt = "QR Code";
    modal.appendChild(qr);

    const addrLine = document.createElement("div");
    addrLine.className = "crypto-addr-line";

    const addrText = document.createElement("span");
    addrText.className = "crypto-addr";
    addrText.textContent = coin.address;

    const copyIcon = document.createElement("span");
    copyIcon.className = "crypto-copy-icon";
    copyIcon.textContent = "📋";

    function copyAddr() {
      navigator.clipboard.writeText(coin.address).then(() => {
        const text = addrText.textContent;
        addrText.textContent = "✅ Copied";
        addrText.classList.add("copied");
        copyIcon.textContent = "✅";
        setTimeout(() => {
          addrText.textContent = text;
          addrText.classList.remove("copied");
          copyIcon.textContent = "📋";
        }, 2000);
      }).catch(() => {});
    }

    addrText.onclick = copyAddr;
    copyIcon.onclick = (e) => { e.stopPropagation(); copyAddr(); };

    addrLine.appendChild(addrText);
    addrLine.appendChild(copyIcon);
    modal.appendChild(addrLine);

    overlay.appendChild(modal);

    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    function escHandler(e) {
      if (e.key === "Escape" && document.body.contains(overlay)) overlay.remove();
    }
    document.addEventListener("keydown", escHandler);

    overlay._cleanup = () => document.removeEventListener("keydown", escHandler);
    overlay.addEventListener("remove", () => overlay._cleanup(), { once: true });

    document.body.appendChild(overlay);
  }

  function getLangPrefix() {
    const m = path.match(/^\/([a-z]{2})\//);
    return m ? m[1] : "en";
  }

  const LOCALES = {
    en: {
      rate: "Rate",
      rated: "Rated",
      ratedTab: "Rated",
      ratedEmpty: "No rated items yet. Rate a show or movie to see it here.",
      download: "Download Selected",
      selectAll: "Select All",
      clear: "Clear",
      season: "Season {n}",
      ofFormat: "{released} of {total} ep.",
      missing: "{count} missing",
      episodesCount: "{count} episodes · {seasons} seasons",
      resolving: "Resolving episode links...",
      resolvingProgress: "Resolving {current} of {total}...",
      checking: "Checking for existing downloads...",
      allDownloaded: "All episodes already downloaded.",
      queued: "Queued {count} episode(s).",
      skipped: "Skipped {count} (already on disk).",
      selectSeason: "Select at least one season.",
      resolveFailed: "Could not resolve any episode URLs.",
      authFailed: "Not logged in. Sign in to ororo.tv first.",
      freeLimit: "Free limit reached. Upgrade your plan to download.",
      showNotFound: "Could not find this show. Try reloading.",
      loadFailed: "Failed to load show data",
      extensionError: "Extension error. Check console or reload.",
      edit: "Edit",
      done: "Done",
      remove: "Remove",
      movie: "Movie",
      support: "Support",
      back: "Back",
      loading: "Loading...",
    },
    fr: {
      rate: "Noter",
      rated: "Noté",
      ratedTab: "Notés",
      ratedEmpty: "Aucun élément noté. Notez un film ou une série pour le voir ici.",
      download: "Télécharger la sélection",
      selectAll: "Tout sélectionner",
      clear: "Effacer",
      season: "Saison {n}",
      ofFormat: "{released} sur {total} ép.",
      missing: "{count} manquant(s)",
      episodesCount: "{count} épisodes · {seasons} saisons",
      resolving: "Résolution des épisodes...",
      resolvingProgress: "Résolution {current} sur {total}...",
      checking: "Vérification des téléchargements existants...",
      allDownloaded: "Tous les épisodes déjà téléchargés.",
      queued: "{count} épisode(s) en file d'attente.",
      skipped: "{count} ignoré(s) (déjà sur le disque).",
      selectSeason: "Sélectionnez au moins une saison.",
      resolveFailed: "Impossible de résoudre les URLs des épisodes.",
      authFailed: "Non connecté. Connectez-vous d'abord à ororo.tv.",
      freeLimit: "Limite gratuite atteinte. Améliorez votre abonnement pour télécharger.",
      showNotFound: "Impossible de trouver cette série. Essayez de recharger.",
      loadFailed: "Échec du chargement des données",
      extensionError: "Erreur d'extension. Vérifiez la console ou rechargez.",
      edit: "Modifier",
      done: "Terminé",
      remove: "Supprimer",
      movie: "Film",
      support: "Soutenir",
      back: "Retour",
      loading: "Chargement...",
    },
    de: {
      rate: "Bewerten",
      rated: "Bewertet",
      ratedTab: "Bewertet",
      ratedEmpty: "Noch keine Bewertungen. Bewerten Sie eine Serie oder einen Film, um sie hier zu sehen.",
      download: "Auswahl herunterladen",
      selectAll: "Alle auswählen",
      clear: "Leeren",
      season: "Staffel {n}",
      ofFormat: "{released} von {total} Ep.",
      missing: "{count} fehlen",
      episodesCount: "{count} Episoden · {seasons} Staffeln",
      resolving: "Löse Episoden-Links auf...",
      resolvingProgress: "Auflösen {current} von {total}...",
      checking: "Prüfe vorhandene Downloads...",
      allDownloaded: "Alle Episoden bereits heruntergeladen.",
      queued: "{count} Episode(n) in der Warteschlange.",
      skipped: "{count} übersprungen (bereits auf der Festplatte).",
      selectSeason: "Wählen Sie mindestens eine Staffel aus.",
      resolveFailed: "Konnte keine Episoden-URLs auflösen.",
      authFailed: "Nicht angemeldet. Melden Sie sich zuerst bei ororo.tv an.",
      freeLimit: "Kostenloses Limit erreicht. Upgrade Ihres Abos zum Herunterladen.",
      showNotFound: "Diese Serie wurde nicht gefunden. Versuchen Sie es mit einem Neuladen.",
      loadFailed: "Laden der Daten fehlgeschlagen",
      extensionError: "Erweiterungsfehler. Überprüfen Sie die Konsole oder laden Sie neu.",
      edit: "Bearbeiten",
      done: "Fertig",
      remove: "Entfernen",
      movie: "Film",
      support: "Unterstützen",
      back: "Zurück",
      loading: "Laden...",
    },
    es: {
      rate: "Puntuar",
      rated: "Puntuado",
      ratedTab: "Puntuados",
      ratedEmpty: "Aún no hay elementos puntuados. Puntúe una serie o película para verla aquí.",
      download: "Descargar selección",
      selectAll: "Seleccionar todo",
      clear: "Limpiar",
      season: "Temporada {n}",
      ofFormat: "{released} de {total} ep.",
      missing: "{count} faltan",
      episodesCount: "{count} episodios · {seasons} temporadas",
      resolving: "Resolviendo enlaces de episodios...",
      resolvingProgress: "Resolviendo {current} de {total}...",
      checking: "Verificando descargas existentes...",
      allDownloaded: "Todos los episodios ya descargados.",
      queued: "{count} episodio(s) en cola.",
      skipped: "{count} omitido(s) (ya en disco).",
      selectSeason: "Seleccione al menos una temporada.",
      resolveFailed: "No se pudieron resolver las URL de los episodios.",
      authFailed: "No has iniciado sesión. Inicia sesión en ororo.tv primero.",
      freeLimit: "Límite gratuito alcanzado. Mejora tu plan para descargar.",
      showNotFound: "No se pudo encontrar esta serie. Intenta recargar.",
      loadFailed: "Error al cargar los datos",
      extensionError: "Error de extensión. Revisa la consola o recarga.",
      edit: "Editar",
      done: "Hecho",
      remove: "Eliminar",
      movie: "Película",
      support: "Apoyar",
      back: "Volver",
      loading: "Cargando...",
    },
    pt: {
      rate: "Avaliar",
      rated: "Avaliado",
      ratedTab: "Avaliados",
      ratedEmpty: "Nenhum item avaliado ainda. Avalie uma série ou filme para vê-lo aqui.",
      download: "Baixar seleção",
      selectAll: "Selecionar tudo",
      clear: "Limpar",
      season: "Temporada {n}",
      ofFormat: "{released} de {total} ep.",
      missing: "{count} faltando",
      episodesCount: "{count} episódios · {seasons} temporadas",
      resolving: "Resolvendo links dos episódios...",
      resolvingProgress: "Resolvendo {current} de {total}...",
      checking: "Verificando downloads existentes...",
      allDownloaded: "Todos os episódios já baixados.",
      queued: "{count} episódio(s) na fila.",
      skipped: "{count} pulado(s) (já no disco).",
      selectSeason: "Selecione pelo menos uma temporada.",
      resolveFailed: "Não foi possível resolver as URLs dos episódios.",
      authFailed: "Não está logado. Faça login no ororo.tv primeiro.",
      freeLimit: "Limite gratuito atingido. Atualize seu plano para baixar.",
      showNotFound: "Não foi possível encontrar esta série. Tente recarregar.",
      loadFailed: "Falha ao carregar dados",
      extensionError: "Erro de extensão. Verifique o console ou recarregue.",
      edit: "Editar",
      done: "Concluído",
      remove: "Remover",
      movie: "Filme",
      support: "Apoiar",
      back: "Voltar",
      loading: "Carregando...",
    },
    ru: {
      rate: "Оценить",
      rated: "Оценено",
      ratedTab: "Оценённые",
      ratedEmpty: "Нет оценённых элементов. Оцените шоу или фильм, чтобы увидеть его здесь.",
      download: "Скачать выбранное",
      selectAll: "Выбрать всё",
      clear: "Очистить",
      season: "Сезон {n}",
      ofFormat: "{released} из {total} эп.",
      missing: "{count} отсутствует",
      episodesCount: "{count} эпизодов · {seasons} сезонов",
      resolving: "Разрешение ссылок эпизодов...",
      resolvingProgress: "Разрешение {current} из {total}...",
      checking: "Проверка существующих загрузок...",
      allDownloaded: "Все эпизоды уже скачаны.",
      queued: "{count} эпизод(ы) в очереди.",
      skipped: "{count} пропущено (уже на диске).",
      selectSeason: "Выберите хотя бы один сезон.",
      resolveFailed: "Не удалось разрешить URL эпизодов.",
      authFailed: "Не авторизованы. Сначала войдите в ororo.tv.",
      freeLimit: "Достигнут бесплатный лимит. Обновите тариф для скачивания.",
      showNotFound: "Не удалось найти это шоу. Попробуйте перезагрузить.",
      loadFailed: "Не удалось загрузить данные",
      extensionError: "Ошибка расширения. Проверьте консоль или перезагрузите.",
      edit: "Редактировать",
      done: "Готово",
      remove: "Удалить",
      movie: "Фильм",
      support: "Поддержать",
      back: "Назад",
      loading: "Загрузка...",
    },
    it: {
      rate: "Vota",
      rated: "Votato",
      ratedTab: "Votati",
      ratedEmpty: "Ancora nessun elemento votato. Vota una serie o un film per vederlo qui.",
      download: "Scarica selezione",
      selectAll: "Seleziona tutto",
      clear: "Cancella",
      season: "Stagione {n}",
      ofFormat: "{released} di {total} ep.",
      missing: "{count} mancanti",
      episodesCount: "{count} episodi · {seasons} stagioni",
      resolving: "Risoluzione link episodi...",
      resolvingProgress: "Risoluzione {current} di {total}...",
      checking: "Controllo download esistenti...",
      allDownloaded: "Tutti gli episodi già scaricati.",
      queued: "{count} episodio(i) in coda.",
      skipped: "{count} saltato(i) (già su disco).",
      selectSeason: "Seleziona almeno una stagione.",
      resolveFailed: "Impossibile risolvere gli URL degli episodi.",
      authFailed: "Non hai effettuato l'accesso. Accedi prima a ororo.tv.",
      freeLimit: "Limite gratuito raggiunto. Aggiorna il tuo piano per scaricare.",
      showNotFound: "Impossibile trovare questa serie. Prova a ricaricare.",
      loadFailed: "Caricamento dati fallito",
      extensionError: "Errore dell'estensione. Controlla la console o ricarica.",
      edit: "Modifica",
      done: "Fatto",
      remove: "Rimuovi",
      movie: "Film",
      support: "Supporta",
      back: "Indietro",
      loading: "Caricamento...",
    },
    pl: {
      rate: "Oceń",
      rated: "Ocenione",
      ratedTab: "Ocenione",
      ratedEmpty: "Brak ocenionych pozycji. Oceń serial lub film, aby zobaczyć go tutaj.",
      download: "Pobierz wybrane",
      selectAll: "Zaznacz wszystko",
      clear: "Wyczyść",
      season: "Sezon {n}",
      ofFormat: "{released} z {total} odc.",
      missing: "{count} brakuje",
      episodesCount: "{count} odcinków · {seasons} sezonów",
      resolving: "Rozpoznawanie linków odcinków...",
      resolvingProgress: "Rozpoznawanie {current} z {total}...",
      checking: "Sprawdzanie istniejących pobrań...",
      allDownloaded: "Wszystkie odcinki już pobrane.",
      queued: "{count} odcinek(ów) w kolejce.",
      skipped: "{count} pominięte (już na dysku).",
      selectSeason: "Wybierz co najmniej jeden sezon.",
      resolveFailed: "Nie udało się rozpoznać URL-i odcinków.",
      authFailed: "Nie jesteś zalogowany. Zaloguj się najpierw do ororo.tv.",
      freeLimit: "Osiągnięto limit darmowy. Zaktualizuj plan, aby pobierać.",
      showNotFound: "Nie można znaleźć tego serialu. Spróbuj odświeżyć.",
      loadFailed: "Nie udało się załadować danych",
      extensionError: "Błąd rozszerzenia. Sprawdź konsolę lub przeładuj.",
      edit: "Edytuj",
      done: "Gotowe",
      remove: "Usuń",
      movie: "Film",
      support: "Wesprzyj",
      back: "Wstecz",
      loading: "Ładowanie...",
    },
    tr: {
      rate: "Puanla",
      rated: "Puanlandı",
      ratedTab: "Puanlananlar",
      ratedEmpty: "Henüz puanlanmış öğe yok. Bir dizi veya filmi puanlamak için buraya tıklayın.",
      download: "Seçimi İndir",
      selectAll: "Tümünü seç",
      clear: "Temizle",
      season: "Sezon {n}",
      ofFormat: "{released} / {total} bl.",
      missing: "{count} eksik",
      episodesCount: "{count} bölüm · {seasons} sezon",
      resolving: "Bölüm linkleri çözülüyor...",
      resolvingProgress: "Çözülüyor {current} / {total}...",
      checking: "Mevcut indirmeler kontrol ediliyor...",
      allDownloaded: "Tüm bölümler zaten indirilmiş.",
      queued: "{count} bölüm sıraya alındı.",
      skipped: "{count} atlandı (zaten diskte).",
      selectSeason: "En az bir sezon seçin.",
      resolveFailed: "Bölüm URL'leri çözülemedi.",
      authFailed: "Giriş yapılmadı. Önce ororo.tv'ye giriş yapın.",
      freeLimit: "Ücretsiz limit aşıldı. İndirmek için planınızı yükseltin.",
      showNotFound: "Bu dizi bulunamadı. Yeniden yüklemeyi deneyin.",
      loadFailed: "Veri yüklenemedi",
      extensionError: "Eklenti hatası. Konsolu kontrol edin veya yeniden yükleyin.",
      edit: "Düzenle",
      done: "Tamam",
      remove: "Kaldır",
      movie: "Film",
      support: "Destek",
      back: "Geri",
      loading: "Yükleniyor...",
    },
  };

  function t(key, params = {}) {
    const lang = getLangPrefix();
    const locale = LOCALES[lang] || LOCALES["en"];
    let str = locale[key];
    if (!str) str = LOCALES["en"][key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp("\\{" + k + "\\}", "g"), v);
    }
    return str;
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
      '<p class="subtitle" id="ororo-dl-subtitle">' + t("loading") + '</p>' +
      '<div id="ororo-dl-watched" class="watched-section"></div>' +
      '<div id="ororo-dl-body"></div>' +
      '<div class="status-bar" id="ororo-dl-status"></div>' +
      '<div class="error-msg" id="ororo-dl-error"></div>' +
      '<div id="ororo-dl-donate-modal" class="donate-modal"></div>' +
      '<button id="ororo-dl-donate-btn" class="donate-btn">❤️ ' + t("support") + '</button>';
    document.body.appendChild(panel);

    const titleEl = document.getElementById("ororo-dl-title");
    const subEl = document.getElementById("ororo-dl-subtitle");
    const bodyEl = document.getElementById("ororo-dl-body");
    const watchedEl = document.getElementById("ororo-dl-watched");
    const statusBar = document.getElementById("ororo-dl-status");
    const errorEl = document.getElementById("ororo-dl-error");

    document.getElementById("ororo-dl-close").onclick = () => panel.remove();

    const donateBtn = document.getElementById("ororo-dl-donate-btn");
    const donateModal = document.getElementById("ororo-dl-donate-modal");
    buildDonateModal();
    donateBtn.onclick = () => {
      panel.classList.add("donate-open");
    };

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

      subEl.textContent = t("episodesCount", { count: episodes.length, seasons: seasons.length });
      renderDownloadSection(bodyEl, titleEl, subEl, statusBar, errorEl);

      const watched = await loadWatched();
      const entry = watched.find((w) => w.id === "show_" + showId);
      buildWatchedSection(watchedEl, "show_" + showId, showName, entry || null);
    } catch (err) {
      const msgs = {
        AUTH_FAILED: t("authFailed"),
        FREE_LIMIT: t("freeLimit"),
        SHOW_NOT_FOUND: t("showNotFound"),
      };
      errorEl.textContent = msgs[err.message] || t("loadFailed") + ": " + err.message;
      errorEl.classList.add("visible");
      subEl.textContent = t("loadFailed");
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
        AUTH_FAILED: t("authFailed"),
        FREE_LIMIT: t("freeLimit"),
      };
      errorEl.textContent = msgs[err.message] || t("loadFailed") + ": " + err.message;
      errorEl.classList.add("visible");
      subEl.textContent = t("loadFailed");
      return;
    }

    if (!showName) {
      showName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      showId = slug;
      if (!posterUrl) posterUrl = tryGetPoster();
    }

    titleEl.textContent = showName;
    subEl.textContent = t("movie");
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
      label.textContent = rating > 0 ? t("rated") : t("rate");
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
    goBtn.textContent = t("download");
    actions1.appendChild(goBtn);
    wrap.appendChild(actions1);

    const actions2 = document.createElement("div");
    actions2.className = "actions";
    const selBtn = document.createElement("button");
    selBtn.className = "btn-select-all";
    selBtn.id = "ororo-dl-select-all";
    selBtn.textContent = t("selectAll");
    const deselBtn = document.createElement("button");
    deselBtn.className = "btn-deselect-all";
    deselBtn.id = "ororo-dl-deselect-all";
    deselBtn.textContent = t("clear");
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
      span.textContent = t("season", { n: s });
      const count = document.createElement("span");
      count.className = "season-count";
      count.textContent = incomplete ? t("ofFormat", { released, total }) : total + " ep.";
      const label = document.createElement("label");
      label.appendChild(cb);
      label.appendChild(span);
      label.appendChild(count);
      if (incomplete) {
        const badge = document.createElement("span");
        badge.className = "season-missing";
        badge.textContent = t("missing", { count: upcoming });
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
        errorEl.textContent = t("selectSeason");
        errorEl.classList.add("visible");
        return;
      }

      errorEl.classList.remove("visible");
      goBtn.disabled = true;
      goBtn.textContent = t("resolving");

      const epsToDl = episodes.filter((e) => selected.includes(e.season));
      const resolved = [];

      for (let i = 0; i < epsToDl.length; i++) {
        statusBar.textContent = t("resolvingProgress", { current: i + 1, total: epsToDl.length });
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
        errorEl.textContent = t("resolveFailed");
        errorEl.classList.add("visible");
        goBtn.disabled = false;
          goBtn.textContent = t("download");
        statusBar.classList.remove("visible");
        return;
      }

      goBtn.textContent = t("checking");

      chrome.runtime.sendMessage(
        { type: "start-download", showName: showName, episodes: resolved },
        (resp) => {
          if (chrome.runtime.lastError) {
            errorEl.textContent = t("extensionError");
            errorEl.classList.add("visible");
          } else if (resp.queued === 0) {
            statusBar.textContent = t("allDownloaded");
            statusBar.classList.add("visible");
          } else {
            const parts = [t("queued", { count: resp.queued })];
            if (resp.skipped > 0) parts.push(t("skipped", { count: resp.skipped }));
            statusBar.textContent = parts.join(" ");
            statusBar.classList.add("visible");
          }
          goBtn.disabled = false;
    goBtn.textContent = t("download");
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
