// main.js
let firstGuestBambini = true;

/* =========================
   FIORI CHE CADONO
========================= */
function creaFioreCadente() {
  const fiore = document.createElement("img");
  fiore.src = "FIORI_BIANCHI.png";
  fiore.className = "fiore-cadente";
  fiore.alt = "";

  fiore.style.left = Math.random() * 100 + "vw";

  const size = 24 + Math.random() * 36;
  fiore.style.width = size + "px";
  fiore.style.height = "auto";

  const durata = 9 + Math.random() * 8;
  fiore.style.animationDuration = durata + "s";

  const drift = (Math.random() * 160 - 80).toFixed(0) + "px";
  fiore.style.setProperty("--drift-x", drift);

  const rot = (Math.random() * 180 - 90).toFixed(0) + "deg";
  fiore.style.setProperty("--rot-end", rot);

  const delay = (Math.random() * 2).toFixed(2) + "s";
  fiore.style.animationDelay = delay;

  const opacity = 0.65 + Math.random() * 0.3;
  fiore.style.opacity = opacity;

  document.getElementById("fiori-container").appendChild(fiore);

  setTimeout(() => fiore.remove(), (durata + 2) * 1000);
}

// più fiori e più frequenti
setInterval(creaFioreCadente, 450);

// piccolo avvio iniziale per riempire subito la pagina
for (let i = 0; i < 12; i++) {
  setTimeout(creaFioreCadente, i * 180);
}

/* =========================
   UI
========================= */
function mostraLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.add("show");
}

function nascondiLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.remove("show");
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

/* =========================
   FORM
========================= */
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
      <label class="label bambini-label">Numero bambini (&lt;6 anni)</label>
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
  const guest = btn.closest(".guest");
  if (guest) guest.remove();
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

    if (!nome || !cognome) {
      throw new Error("Compila nome e cognome per tutti gli invitati.");
    }

    if (seggiolone > bambini) {
      throw new Error("Il numero di seggioloni non può essere maggiore del numero di bambini.");
    }

    if (presenza === "SI" && !menu) {
      throw new Error(`Seleziona il menu per ${nome} ${cognome}.`);
    }

    payload.push({
      key: EVENT_KEY,
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

/* =========================
   FETCH CON TIMEOUT
========================= */
async function postConTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(timer);
  }
}

/* =========================
   INVIO
========================= */
async function invia() {
  nascondiErrore();

  let payload;
  try {
    payload = raccogliPayload();
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: EVENT_KEY,
          invitati: payload
        })
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`Errore server (${response.status}).`);
    }

    let result = null;
    const text = await response.text();

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("La risposta del server non è valida.");
    }

    // atteso: { success: true }
    if (!result || result.success !== true) {
      const apiMessage =
        result?.message ||
        "Il salvataggio non è andato a buon fine. Controlla lo script collegato al Google Sheet.";
      throw new Error(apiMessage);
    }

    window.location.href = "grazie.html";
  } catch (err) {
    if (err.name === "AbortError") {
      mostraErrore("La richiesta ha impiegato troppo tempo. Riprova tra poco.");
    } else {
      mostraErrore(err.message || "Si è verificato un errore durante il salvataggio.");
    }
  } finally {
    nascondiLoading();
  }
}

window.onload = () => {
  aggiungiInvitato();
};