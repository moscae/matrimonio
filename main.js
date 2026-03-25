// main.js
let firstGuestBambini = true;

/* PETALI */
function creaPetalo() {
  const petalo = document.createElement("div");
  petalo.className = "petalo";

  petalo.style.left = Math.random() * 100 + "vw";

  const durata = 6 + Math.random() * 6;
  petalo.style.animationDuration = durata + "s";

  const size = 10 + Math.random() * 12;
  petalo.style.width = size + "px";
  petalo.style.height = size * 1.4 + "px";

  const colori = ["#ffffff", "#f8eaea", "#f3e5f5"];
  petalo.style.background = colori[Math.floor(Math.random() * colori.length)];

  document.getElementById("petali-container").appendChild(petalo);

  setTimeout(() => petalo.remove(), durata * 1000);
}
setInterval(creaPetalo, 350);

/* FIORI LATERALI RANDOM */
function creaFiore() {
  const fiore = document.createElement("img");
  fiore.src = "FIORI_BIANCHI.png";  // sostituire con immagine reale
  fiore.className = "fiore";

  const lato = Math.random() < 0.5 ? "left" : "right";
  fiore.style[lato] = "10px";
  fiore.style.top = 50 + Math.random() * 400 + "px";
  fiore.style.width = 40 + Math.random() * 30 + "px";

  const durata = (6 + Math.random() * 6) + "s";
  fiore.style.animationDuration = durata;

  document.getElementById("fiori-container").appendChild(fiore);

  setTimeout(() => fiore.remove(), parseFloat(durata) * 1000);
}
setInterval(creaFiore, 1500);

/* FORM */
function aggiungiInvitato() {
  const container = document.getElementById("guests");
  const div = document.createElement("div");
  div.className = "guest";

  let html = `
<input class="nome" placeholder="Nome">
<input class="cognome" placeholder="Cognome">
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

  if(firstGuestBambini){
    html += `
<label class="label">Numero bambini (<6 anni)</label>
<input class="bambini" type="number" min="0">
<label class="label">Numero di Seggioloni necessari</label>
<input class="seggiolone" type="number" min="0" value="0" style="display:none">
`;
  } else {
    html += `<button class="remove-btn" onclick="rimuoviInvitato(this)">✖</button>`;
  }

  div.innerHTML = html;
  container.appendChild(div);

  const presenza = div.querySelector(".presenza");
  const menu = div.querySelector(".menu");

  presenza.addEventListener("change", () => {
    menu.style.display = presenza.value === "SI" ? "block" : "none";
    if (presenza.value !== "SI") menu.value = "";
  });

  if (firstGuestBambini) {
  const bambini = div.querySelector(".bambini");
  const seggiolone = div.querySelector(".seggiolone");

  // Inizialmente nascosto
  seggiolone.style.display = "none";

  // Mostra/nascondi seggiolone se bambini > 0
  bambini.addEventListener("input", () => {
    const val = parseInt(bambini.value) || 0;
    if (val > 0) {
      seggiolone.style.display = "block";
    } else {
      seggiolone.style.display = "none";
      seggiolone.value = 0;
    }
  });

  firstGuestBambini = false;
}
}

function rimuoviInvitato(btn) {
  btn.parentElement.remove();
}

async function invia() {
  const guests = document.querySelectorAll(".guest");
  const payload = [];

  guests.forEach((g,i)=>{
    const bambini = parseInt(g.querySelector(".bambini")?.value || 0);
    const seggiolone = parseInt(g.querySelector(".seggiolone")?.value || 0);

    if(seggiolone > bambini){
      alert("Seggioloni non validi");
      return;
    }

    payload.push({
      key: "matrimonio-2026-federica-eugenio",
      nome: g.querySelector(".nome").value,
      cognome: g.querySelector(".cognome").value,
      presenza: g.querySelector(".presenza").value,
      menu: g.querySelector(".menu").value,
      intolleranze: g.querySelector(".intolleranze").value,
      bambini: i === 0 ? bambini : 0,
      seggiolone: i === 0 ? seggiolone : 0
    });
  });

  await fetch(API_URL, {
    method:"POST",
    body: JSON.stringify(payload),
    headers: {"Content-Type":"application/json"}
  });

  window.location.href="grazie.html";
}

window.onload = () => aggiungiInvitato();
