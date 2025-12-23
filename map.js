// Alaptérkép
const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Ikonok
const icons = {
  FM:     L.icon({ iconUrl: 'icons/fm.svg', iconSize: [32, 32] }),
  DMR:    L.icon({ iconUrl: 'icons/dmr.svg', iconSize: [32, 32] }),
  C4FM:   L.icon({ iconUrl: 'icons/c4fm.svg', iconSize: [32, 32] }),
  DSTAR:  L.icon({ iconUrl: 'icons/dstar.svg', iconSize: [32, 32] })
};

// Mód alapján ikon választása
function pickIcon(modes) {
  if (!modes || modes.length === 0) return icons.FM;

  const upper = modes.map(m => m.toUpperCase());

  if (upper.includes("DMR")) return icons.DMR;
  if (upper.includes("C4FM")) return icons.C4FM;
  if (upper.includes("DSTAR")) return icons.DSTAR;

  return icons.ANALOG;
}

// JSON betöltése
fetch("repeaters.json")
  .then(r => r.json())
  .then(list => {
    console.log("Betöltött átjátszók:", list.length);

    list.forEach(rep => {
      const { lat, lon } = locatorToLatLon(rep.locator);

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn("Hibás lokátor:", rep.callsign, rep.locator);
        return;
      }

      L.marker([lat, lon], { icon: pickIcon(rep.mode) })
        .addTo(map)
        .bindPopup(`
          <b>${rep.callsign}</b><br>
          ${rep.qth}<br><br>

          <b>RX:</b> ${rep.rx_mhz} MHz<br>
          <b>TX:</b> ${rep.tx_mhz} MHz<br>
          <b>Shift:</b> ${rep.shift_khz} kHz<br>
          <b>Tone:</b> ${rep.tone || "-"}<br>
          <b>Módok:</b> ${rep.mode.join(", ")}<br><br>

          ${rep.notes ? rep.notes + "<br><br>" : ""}
          <b>Állapot:</b> ${rep.status}
        `);
    });
  })
  .catch(err => {
    console.error("Hiba a JSON betöltésekor:", err);
  });
