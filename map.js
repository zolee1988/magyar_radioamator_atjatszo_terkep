const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// ikonok módonként
const icons = {
  ANALOG: L.icon({ iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-green.png', iconSize: [28, 28] }),
  DMR:    L.icon({ iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png', iconSize: [28, 28] }),
  C4FM:   L.icon({ iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-orange.png', iconSize: [28, 28] }),
  DSTAR:  L.icon({ iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-yellow.png', iconSize: [28, 28] })
};

function pickIcon(modes) {
  if (modes.includes("DMR")) return icons.DMR;
  if (modes.includes("C4FM")) return icons.C4FM;
  if (modes.includes("DSTAR")) return icons.DSTAR;
  return icons.ANALOG;
}

fetch("repeaters.json")
  .then(r => r.json())
  .then(list => {
    list.forEach(rep => {
      const { lat, lon } = locatorToLatLon(rep.locator);

      L.marker([lat, lon], { icon: pickIcon(rep.mode) })
        .addTo(map)
        .bindPopup(`
          <b>${rep.callsign}</b><br>
          ${rep.qth}<br><br>
          RX: ${rep.rx_mhz} MHz<br>
          TX: ${rep.tx_mhz} MHz<br>
          Módok: ${rep.mode.join(", ")}<br>
          ${rep.tone ? "Tone: " + rep.tone + "<br>" : ""}
          ${rep.notes ? rep.notes + "<br>" : ""}
          Állapot: ${rep.status}
        `);
    });
  });
