const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

fetch("repeaters.json")
  .then(r => {
    console.log("JSON betöltve:", r);
    return r.json();
  })
  .then(list => {
    console.log("JSON tartalom:", list);

    list.forEach(rep => {
      const { lat, lon } = locatorToLatLon(rep.locator);

      console.log("Marker:", rep.callsign, lat, lon);

      // Ha a lokátor hibás, ne tegyen ki markert
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn("Hibás lokátor:", rep.callsign, rep.locator);
        return;
      }

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`
          <b>${rep.callsign}</b><br>
          ${rep.qth}<br>
          RX: ${rep.rx_mhz} MHz<br>
          TX: ${rep.tx_mhz} MHz<br>
          Módok: ${rep.mode.join(", ")}
        `);
    });
  })
  .catch(err => {
    console.error("Hiba a JSON betöltésekor:", err);
  });
