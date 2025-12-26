// Alaptérkép
const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* ────────────────────────────────────────────────
   Ikonok
   ──────────────────────────────────────────────── */

const icons = {
  fm_active: L.icon({ iconUrl: 'icons/fm_active.svg', iconSize: [32, 32] }),
  fm_inactive: L.icon({ iconUrl: 'icons/fm_inactive.svg', iconSize: [32, 32] }),
  dig_active: L.icon({ iconUrl: 'icons/digital_active.svg', iconSize: [32, 32] }),
  dig_inactive: L.icon({ iconUrl: 'icons/digital_inactive.svg', iconSize: [32, 32] })
};

// Ikonválasztás (FM prioritás)
function pickIcon(rep) {
  const modes = rep.mode.map(m => m.toUpperCase());
  const isActive = rep.status.toUpperCase() === "ACTIVE";

  const hasFM = modes.includes("FM") || modes.includes("ANALOG");
  const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "D-STAR", "DIGITAL"].includes(m));
  

  if (hasFM) return isActive ? icons.fm_active : icons.fm_inactive;
  if (hasDigital) return isActive ? icons.dig_active : icons.dig_inactive;

  return isActive ? icons.fm_active : icons.fm_inactive;
}

// JSON betöltése
fetch("repeaters.json")
  .then(r => r.json())
  .then(list => {
    console.log("Betöltött átjátszók:", list.length);

    const markers = L.markerClusterGroup();
    const allMarkers = [];

    // Lokátor duplikátumok
    const locatorGroups = {};
    list.forEach(rep => {
      if (!locatorGroups[rep.locator]) {
        locatorGroups[rep.locator] = [];
      }
      locatorGroups[rep.locator].push(rep);
    });

    list.forEach(rep => {
      // Lokátorból koordináta
      let { lat, lon } = locatorToLatLon(rep.locator);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn("Hibás lokátor:", rep.callsign, rep.locator);
        return;
      }

      // Duplikált lokátor eltolása
      const group = locatorGroups[rep.locator];
      if (group.length > 1) {
        const index = group.indexOf(rep);
        const offset = 0.001;
        const angle = (index / group.length) * 2 * Math.PI;
        lat += Math.sin(angle) * offset;
        lon += Math.cos(angle) * offset;
      }

      const isActive = rep.status.toUpperCase() === "ACTIVE";
      const statusHu = isActive
        ? '<span style="color: #00ff4c;">aktív</span>'
        : '<span style="color: #ff3b3b;">inaktív</span>';

      const modes = rep.mode.map(m => m.toUpperCase());
      const hasFM = modes.includes("FM") || modes.includes("ANALOG");
      const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "DIGITAL"].includes(m));

      let toneOrCc = "";
      if (hasFM && rep.tone) {
        toneOrCc = `<b>CTCSS DL/UL [Hz]:</b> ${rep.tone}<br>`;
      } else if (hasDigital && rep.cc !== null && rep.cc !== undefined) {
        toneOrCc = `<b>CC:</b> ${rep.cc}<br>`;
      }

      const ha2toLink = `http://ha2to.orbel.hu/content/repeaters/hu/${rep.callsign}.html`;

      const popupHtml = `
  <div class="popup">
    
    <div class="title">
      <a href="${ha2toLink}" target="_blank">
        ${rep.callsign}
      </a>
    </div>

    <div class="qth">${rep.qth}</div>

    <table>
      <tr><th>Lokátor:</th><td>${rep.locator}</td></tr>
      <tr><th>ASL:</th><td>${rep.asl_m} m</td></tr>
    </table>

    <hr>

    <b>Üzemmódok:</b> ${rep.mode.join(", ")}

    <hr>

    <table>
      <tr><th>RX:</th><td>${rep.rx_khz} kHz</td></tr>
      <tr><th>TX:</th><td>${rep.tx_khz} kHz</td></tr>
      <tr><th>Shift:</th><td>${rep.shift_khz} kHz</td></tr>
      ${toneOrCc ? `<tr><th>Tone/CC:</th><td>${toneOrCc}</td></tr>` : ""}
    </table>

    ${rep.notes ? `
      <hr>
      <b>Megjegyzés:</b>
      ${rep.notes.replace(/\n/g, "<br>")}
    ` : ""}

    <hr>

    <b>Állapot:</b> ${statusHu}

  </div>
`;


      const marker = L.marker([lat, lon], { icon: pickIcon(rep) }).bindPopup(popupHtml);

      allMarkers.push({ marker, rep });
      markers.addLayer(marker);
    });

    // SZŰRŐ LOGIKA
    function applyFilters() {
  const showActive = document.getElementById("filterActive").checked;
  const showInactive = document.getElementById("filterInactive").checked;
  const showAnalog = document.getElementById("filterAnalog").checked;
  const showDigital = document.getElementById("filterDigital").checked;

  markers.clearLayers();

  allMarkers.forEach(obj => {
    const rep = obj.rep;

    const isActive = rep.status.toUpperCase() === "ACTIVE";
    const modes = rep.mode.map(m => m.toUpperCase());
    const isAnalog = modes.includes("FM") || modes.includes("ANALOG");
    const isDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "DIGITAL"].includes(m));

    // Aktív / inaktív szűrés
    if (!isActive && !showInactive) return;
    if (isActive && !showActive) return;

    // Analóg / digitális szűrés – HELYES LOGIKA
    const modeAllowed =
      (isAnalog && showAnalog) ||
      (isDigital && showDigital);

    if (!modeAllowed) return;

    markers.addLayer(obj.marker);
  });
}


    // SZŰRŐ ESEMÉNYEK – az új panelre mutat
    document.querySelectorAll("#bottomPanel input[type='checkbox']").forEach(cb => {
      cb.addEventListener("change", applyFilters);
    });

    map.addLayer(markers);
  })
  .catch(err => {
    console.error("Hiba a JSON betöltésekor:", err);
  });
