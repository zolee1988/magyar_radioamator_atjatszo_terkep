// Alaptérkép
const map = L.map('map').setView([47.2, 19.5], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* ────────────────────────────────────────────────
   MAIDENHEAD GRID RÉTEG (6 karakteres lokátor)
   ──────────────────────────────────────────────── */

const maidenhead = L.maidenhead({
  color: "#ff8800",
  weight: 1,
  opacity: 0.6,
  showLabels: true,
  precision: 3   // 6 karakteres lokátor (JN97eh)
});

maidenhead.addTo(map);  // GRID bekapcsolva induláskor

// Ha szeretnéd később ki-be kapcsolhatóvá tenni:
// L.control.layers(null, { "Maidenhead GRID": maidenhead }).addTo(map);

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
  const hasDigital = modes.some(m => ["DMR", "C4FM", "DSTAR", "DIGITAL"].includes(m));

  if (hasFM) return isActive ? icons.fm_active : icons.fm_inactive;
  if (hasDigital) return isActive ? icons.dig_active : icons.dig_inactive;

  return isActive ? icons.fm_active : icons.fm_inactive;
}
