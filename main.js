let firstGuestBambini = true;

/* FIORI CHE CADONO */
function creaFioreCadente() {
  const fiore = document.createElement("img");
  fiore.src = "FIORI_BIANCHI.png";
  fiore.className = "fiore-cadente";
  fiore.alt = "";

  fiore.style.left = Math.random() * 100 + "vw";

  const size = 24 + Math.random() * 36;
  fiore.style.width = size + "px";

  const durata = 9 + Math.random() * 8;
  fiore.style.animationDuration = durata + "s";

  fiore.style.setProperty("--drift-x", (Math.random() * 160 - 80).toFixed(0) + "px");
  fiore.style.setProperty("--rot-end", (Math.random() * 180 - 90).toFixed(0) + "deg");
  fiore.style.opacity = 0.65 + Math.random() * 0.3;

  document.getElementById("fiori-container").appendChild(fiore);
  setTimeout(() => fiore.remove(), (durata + 2) * 1000);
}

setInterval(creaFioreCadente, 450);
for (let i = 0; i < 12; i++) setTimeout(creaFioreCadente, i * 180);

function mostraLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
}

function nascondiLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

function mostraErrore(msg) {
  const box = document.getElementById("errorBox");
  box.textContent = msg;
  box.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nascondiErrore() {
  const box = document.getElementById("errorBox");
  box.style.display = "none";
  box.textContent = "";
}

function aggiungiInvitato() {
  const container = document.getElementById("guests");
  const div = document.createElement("div");
  div.className = "guest";

  let html = `
    <input class="nome" placeholder="Nome" autocomplete="off">
    <input class="cognome" placeholder="Cognome" autocomplete="off">

    <select class="presenza">
      <option value="SI">Parteciperò</option>
      <option value="NO">Non partecipo</option>
    </select>

    <select class="menu">
      <option value="">Menu</option>
      <option value="Carne">Carne</option>
      <option value="Vegetariano">Vegetariano</option>
    </select>

    <textarea class="intolleranze" placeholder="Allergie/intolleranze"></textarea>
  `;

  if (firstGuestBambini) {
    html += `
      <label class="label">Numero bambini (&lt;6 anni)</label>
      <input class="bambini" type="number" min="0" value="0" inputmode="numeric">

      <div class="seggiolone-wrap" style="display:none;">
        <label class="label">Numero di Seggioloni necessari</label>
        <input class="seggiolone" type="number" min="0" value="0" inputmode="numeric">
      </div>
    `;
  } else {
    html += `<button type="button" class="remove-btn" onclick="rimuoviInvitato(this)">✖</button>`;
  }

  div.innerHTML = html;
  container.appendChild(div);

  const presenza = div.querySelector(".presenza");
  const menu = div.querySelector(".menu");

  function aggiornaMenu() {
    if (presenza.value === "SI") {
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
      menu.value = "";
    }
  }

  presenza.addEventListener("change", aggiornaMenu);
  aggiornaMenu();

  if (firstGuestBambini) {
    const bambini = div.querySelector(".bambini");
    const seggioloneWrap = div.querySelector(".seggiolone-wrap");
    const seggiolone = div.querySelector(".seggiolone");

    function aggiornaSeggiolone() {
      const val = parseInt(bambini.value, 10) || 0;
      if (val > 0) {
        seggioloneWrap.style.display = "block";
      } else {
        seggioloneWrap.style.display = "none";
        seggiolone.value = 0;
      }
    }

    bambini.addEventListener("input", aggiornaSeggiolone);
    bambini.addEventListener("change", aggiornaSeggiolone);
    aggiornaSeggiolone();

    firstGuestBambini = false;
  }
}

function rimuoviInvitato(btn) {
  btn.closest(".guest")?.remove();
}

function raccogliPayload() {
  const guests = document.querySelectorAll(".guest");
  const payload = [];

  for (const [i, g] of Array.from(guests).entries()) {
    const nome = g.querySelector(".nome")?.value.trim() || "";
    const cognome = g.querySelector(".cognome")?.value.trim() || "";
    const presenza = g.querySelector(".presenza")?.value || "SI";
    const menu = g.querySelector(".menu")?.value || "";
    const intolleranze = g.querySelector(".intolleranze")?.value.trim() || "";
    const bambini = parseInt(g.querySelector(".bambini")?.value || "0", 10) || 0;
    const seggiolone = parseInt(g.querySelector(".seggiolone")?.value || "0", 10) || 0;

    if (!nome || !cognome) throw new Error("Compila nome e cognome per tutti gli invitati.");
    if (seggiolone > bambini) throw new Error("Il numero di seggioloni non può essere maggiore del numero di bambini.");
    if (presenza === "SI" && !menu) throw new Error(`Seleziona il menu per ${nome} ${cognome}.`);

    payload.push({
      nome,
      cognome,
      presenza,
      menu: presenza === "SI" ? menu : "",
      intolleranze,
      bambini: i === 0 ? bambini : 0,
      seggiolone: i === 0 ? seggiolone : 0
    });
  }

  return payload;
}

async function postConTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function invia() {
  nascondiErrore();

  let invitati;
  try {
    invitati = raccogliPayload();
  } catch (err) {
    mostraErrore(err.message || "Controlla i dati inseriti.");
    return;
  }

  mostraLoading();

  try {
    const response = await postConTimeout(
      API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          key: EVENT_KEY,
          invitati
        })
      },
      API_TIMEOUT_MS
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text || "errore server"}`);
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("La risposta del server non è JSON valido: " + text);
    }

    if (!result.success) {
      throw new Error(result.message || "Salvataggio non riuscito.");
    }

    window.location.href = "grazie.html";
  } catch (err) {
    if (err.name === "AbortError") {
      mostraErrore("La richiesta ha impiegato troppo tempo. Controlla il deployment Apps Script e riprova.");
    } else {
      mostraErrore("Errore di invio: " + (err.message || "Failed to fetch"));
    }
    console.error("Errore fetch:", err);
  } finally {
    nascondiLoading();
  }
}

window.onload = () => aggiungiInvitato();
