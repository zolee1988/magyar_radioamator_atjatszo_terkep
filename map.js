// Alaptérkép
const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Ikonok
const icons = {
  fm_active: L.icon({ iconUrl: 'icons/fm_active.svg', iconSize: [32, 32] }),
  fm_inactive: L.icon({ iconUrl: 'icons/fm_inactive.svg', iconSize: [32, 32] }),
  dig_active: L.icon({ iconUrl: 'icons/digital_active.svg', iconSize: [32, 32] }),
  dig_inactive: L.icon({ iconUrl: 'icons/digital_inactive.svg', iconSize: [32, 32] })
};

// Mód alapján ikon választása (FM prioritással)
function pickIcon(rep) {
  const modes = rep.mode.map(m => m.toUpperCase());
  const isActive = rep.status.toUpperCase() === "ACTIVE";

  const hasFM = modes.includes("FM") || modes.includes("ANALOG");
  const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "DIGITAL"].includes(m));

  if (hasFM) {
    return isActive ? icons.fm_active : icons.fm_inactive;
  }

  if (hasDigital) {
    return isActive ? icons.dig_active : icons.dig_inactive;
  }

  return isActive ? icons.fm_active : icons.fm_inactive;
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

      // Magyar státusz + szín
      const isActive = rep.status.toUpperCase() === "ACTIVE";
      const statusHu = isActive
        ? '<span style="color: green;">aktív</span>'
        : '<span style="color: red;">inaktív</span>';

      // Módok
      const modes = rep.mode.map(m => m.toUpperCase());
      const hasFM = modes.includes("FM") || modes.includes("ANALOG");
      const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "DIGITAL"].includes(m));

      // Tone / CC logika
      let toneOrCc = "";
      if (hasFM && rep.tone) {
        toneOrCc = `<b>CTCSS DL/UL [Hz]:</b> ${rep.tone}<br>`;
      } else if (hasDigital && rep.cc !== null && rep.cc !== undefined) {
        toneOrCc = `<b>CC:</b> ${rep.cc}<br>`;
      }

      // Popup HTML
      const popupHtml = `
        <b>${rep.callsign}</b><br>
        ${rep.qth}<br><br>

        <b>RX:</b> ${rep.rx_mhz} MHz<br>
        <b>TX:</b> ${rep.tx_mhz} MHz<br>
        <b>Shift:</b> ${rep.shift_khz} kHz<br>
        ${toneOrCc}
        <b>Módok:</b> ${rep.mode.join(", ")}<br>
        <b>Lokátor:</b> ${rep.locator}<br>
        <b>ASL:</b> ${rep.asl_m} m<br><br>

        <b>Állapot:</b> ${statusHu}<br>
        ${rep.notes ? rep.notes + "<br>" : ""}
      `;

      L.marker([lat, lon], { icon: pickIcon(rep) })
        .addTo(map)
        .bindPopup(popupHtml);
    });
  })
  .catch(err => {
    console.error("Hiba a JSON betöltésekor:", err);
  });
