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

    // --- LOKÁTOR DUPLIKÁTUMOK KEZELÉSE ---
    const locatorGroups = {};
    list.forEach(rep => {
      if (!locatorGroups[rep.locator]) {
        locatorGroups[rep.locator] = [];
      }
      locatorGroups[rep.locator].push(rep);
    });
    // -------------------------------------

    list.forEach(rep => {

      // Lokátorból koordináta
      let { lat, lon } = locatorToLatLon(rep.locator);

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn("Hibás lokátor:", rep.callsign, rep.locator);
        return;
      }

      // --- MARKER ELTOLÁS DUPLIKÁLT LOKÁTOR ESETÉN ---
      const group = locatorGroups[rep.locator];
      if (group.length > 1) {
        const index = group.indexOf(rep);
        const offset = 0.001; // kb. 100–120 m
        const angle = (index / group.length) * 2 * Math.PI;

        lat += Math.sin(angle) * offset;
        lon += Math.cos(angle) * offset;
      }
      // ------------------------------------------------

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
      const ha2toLink = `http://ha2to.orbel.hu/content/repeaters/hu/${rep.callsign}.html`;

      const popupHtml = `
        <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;">

          <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
            <a href="${ha2toLink}" target="_blank" style="color: #0066cc; text-decoration: none;">
              ${rep.callsign}
            </a>
          </div>

          <div style="margin-bottom: 6px;">
            ${rep.qth}
          </div>

          <div style="margin-bottom: 8px;">
            <b>Lokátor:</b> ${rep.locator}<br>
            <b>ASL:</b> ${rep.asl_m} m
          </div>

          <div style="border-top: 1px solid #ccc; margin: 6px 0;"></div>

          <b>Üzemmódok:</b> ${rep.mode.join(", ")}<br>

          <div style="border-top: 1px solid #ccc; margin: 6px 0;"></div>

          <b>RX:</b> ${rep.rx_mhz} MHz<br>
          <b>TX:</b> ${rep.tx_mhz} MHz<br>
          <b>Shift:</b> ${rep.shift_khz} kHz<br>
          ${toneOrCc}

          <div style="border-top: 1px solid #ccc; margin: 6px 0;"></div>

          ${rep.notes ? `<b>Megjegyzés:</b> ${rep.notes}<br>` : ""}

          <b>Állapot:</b> ${statusHu}<br>

        </div>
      `;

      L.marker([lat, lon], { icon: pickIcon(rep) })
        .addTo(map)
        .bindPopup(popupHtml);
    });
  })
  .catch(err => {
    console.error("Hiba a JSON betöltésekor:", err);
  });
