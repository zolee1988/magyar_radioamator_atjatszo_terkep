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
  dig_inactive: L.icon({ iconUrl: 'icons/digital_inactive.svg', iconSize: [32, 32] }),

  beacon_active: L.icon({ iconUrl: 'icons/beacon_active.svg', iconSize: [32, 32] }),
  beacon_inactive: L.icon({ iconUrl: 'icons/beacon_inactive.svg', iconSize: [32, 32] })
};

// Ikonválasztás átjátszókhoz
function pickIcon(rep) {
  const modes = rep.mode.map(m => m.toUpperCase());
  const isActive = rep.status.toUpperCase() === "ACTIVE";

  const hasFM = modes.includes("FM") || modes.includes("ANALOG");
  const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "D-STAR", "DIGITAL"].includes(m));

  if (hasFM) return isActive ? icons.fm_active : icons.fm_inactive;
  if (hasDigital) return isActive ? icons.dig_active : icons.dig_inactive;

  return isActive ? icons.fm_active : icons.fm_inactive;
}

/* ────────────────────────────────────────────────
   CLUSTEREK
   ──────────────────────────────────────────────── */

const repeaterCluster = L.markerClusterGroup();
const beaconCluster = L.markerClusterGroup({ disableClusteringAtZoom: 12 });

let allRepeaters = [];
let allBeacons = [];

/* ────────────────────────────────────────────────
   ÁTJÁTSZÓK BETÖLTÉSE
   ──────────────────────────────────────────────── */

fetch("repeaters.json")
  .then(r => r.json())
  .then(list => {
    console.log("Betöltött átjátszók:", list.length);

    allRepeaters = [];

    // Lokátor duplikátumok
    const locatorGroups = {};
    list.forEach(rep => {
      if (!locatorGroups[rep.locator]) locatorGroups[rep.locator] = [];
      locatorGroups[rep.locator].push(rep);
    });

    list.forEach(rep => {
      let { lat, lon } = locatorToLatLon(rep.locator);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

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
        ? '<span style="color:#00ff4c;">aktív</span>'
        : '<span style="color:#ff3b3b;">inaktív</span>';

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
            <a href="${ha2toLink}" target="_blank">${rep.callsign}</a>
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

      allRepeaters.push({ marker, rep });
      repeaterCluster.addLayer(marker);
    });

    map.addLayer(repeaterCluster);
  });

/* ────────────────────────────────────────────────
   BEACONS BETÖLTÉSE
   ──────────────────────────────────────────────── */

fetch("beacons.json")
  .then(r => r.json())
  .then(beacons => {
    console.log("Betöltött jeladók:", beacons.length);

    allBeacons = [];

    // Lokátor duplikátumok kezelése
    const beaconLocatorGroups = {};
    beacons.forEach(b => {
      if (!beaconLocatorGroups[b.locator]) beaconLocatorGroups[b.locator] = [];
      beaconLocatorGroups[b.locator].push(b);
    });

    beacons.forEach(b => {
      let { lat, lon } = locatorToLatLon(b.locator);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

      // Duplikált lokátor eltolása
      const group = beaconLocatorGroups[b.locator];
      if (group.length > 1) {
        const index = group.indexOf(b);
        const offset = 0.001;
        const angle = (index / group.length) * 2 * Math.PI;
        lat += Math.sin(angle) * offset;
        lon += Math.cos(angle) * offset;
      }

      const isActive = b.status.toUpperCase() === "ACTIVE";

      const icon = isActive ? icons.beacon_active : icons.beacon_inactive;

      const ha2toLink = `http://ha2to.orbel.hu/content/beacons/hu/${b.callsign}.html`;

const popup = `
  <div class="popup">
    <div class="title">
      <a href="${ha2toLink}" target="_blank">${b.callsign}</a>
    </div>

    <div class="qth">${b.qth_name}</div>

    <table>
      <tr><th>Lokátor:</th><td>${b.locator}</td></tr>
      <tr><th>ASL:</th><td>${b.asl_m} m</td></tr>
      <tr><th>AGL:</th><td>${b.agl_m} m</td></tr>
    </table>

    <hr>

    <b>Üzemmód:</b> ${b.modulation}

    <hr>

    <table>
      <tr><th>Frekvencia:</th><td>${b.frequency_mhz} MHz</td></tr>
      
      <tr><th>Antenna:</th><td>${b.antenna}</td></tr>
      <tr><th>Polarizáció:</th><td>${b.polarization}</td></tr>
      <tr><th>Teljesítmény:</th><td>${b.power_w} W</td></tr>
    </table>

    <hr>

    <b>Állapot:</b> ${b.status}<br>
    <b>Frissítve:</b> ${b.last_update}
  </div>
`;


      const marker = L.marker([lat, lon], { icon }).bindPopup(popup);

      allBeacons.push({ marker, b });
      beaconCluster.addLayer(marker);
    });

    map.addLayer(beaconCluster);
  });

/* ────────────────────────────────────────────────
   SZŰRŐ LOGIKA
   ──────────────────────────────────────────────── */

function applyFilters() {
  const showRepeaters = document.getElementById("filterRepeaters").checked;
  const showBeacons = document.getElementById("filterBeacons").checked;

  const showActive = document.getElementById("filterActive").checked;
  const showInactive = document.getElementById("filterInactive").checked;

  const showAnalog = document.getElementById("filterAnalog").checked;
  const showDigital = document.getElementById("filterDigital").checked;

  /* Átjátszók szűrése */
  repeaterCluster.clearLayers();

  if (showRepeaters) {
    allRepeaters.forEach(obj => {
      const rep = obj.rep;

      const isActive = rep.status.toUpperCase() === "ACTIVE";
      const modes = rep.mode.map(m => m.toUpperCase());
      const isAnalog = modes.includes("FM") || modes.includes("ANALOG");
      const isDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "D-STAR", "DIGITAL"].includes(m));

      if (!isActive && !showInactive) return;
      if (isActive && !showActive) return;

      const modeAllowed =
        (isAnalog && showAnalog) ||
        (isDigital && showDigital);

      if (!modeAllowed) return;

      repeaterCluster.addLayer(obj.marker);
    });
  }

  /* Jeladók szűrése */
  beaconCluster.clearLayers();

  if (showBeacons) {
    allBeacons.forEach(obj => {
      const b = obj.b;

      const isActive = b.status.toUpperCase().includes("AKT");

      if (!isActive && !showInactive) return;
      if (isActive && !showActive) return;

      beaconCluster.addLayer(obj.marker);
    });
  }
}

/* Események */
document.querySelectorAll("#bottomPanel input[type='checkbox']").forEach(cb => {
  cb.addEventListener("change", applyFilters);
});
