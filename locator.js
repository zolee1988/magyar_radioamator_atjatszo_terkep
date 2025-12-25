function locatorToLatLon(locator) {
  if (!locator || locator.length < 4) return { lat: 0, lon: 0 };

  locator = locator.toUpperCase();
  const A = 'A'.charCodeAt(0);

  let lon = -180;
  let lat = -90;

  // 1–2. karakter: mező (Field)
  lon += (locator.charCodeAt(0) - A) * 20;
  lat += (locator.charCodeAt(1) - A) * 10;

  // 3–4. karakter: négyzet (Square)
  if (locator.length >= 4) {
    lon += (locator.charCodeAt(2) - 48) * 2;
    lat += (locator.charCodeAt(3) - 48) * 1;
  }

  // 5–6. karakter: alnégyzet (Subsquare)
  if (locator.length >= 6) {
    lon += (locator.charCodeAt(4) - A) / 12;
    lat += (locator.charCodeAt(5) - A) / 24;
  }

  // 7–8. karakter: szektor (Extended square)
  if (locator.length >= 8) {
    lon += (locator.charCodeAt(6) - 48) / 120;
    lat += (locator.charCodeAt(7) - 48) / 240;
  }

  // 9–10. karakter: finom szektor (Extended subsquare)
  if (locator.length >= 10) {
    lon += (locator.charCodeAt(8) - A) / 2880;
    lat += (locator.charCodeAt(9) - A) / 5760;
  }

  // Középpont eltolás
  lon += (locator.length >= 6 ? 1/12 : locator.length >= 4 ? 1 : 10);
  lat += (locator.length >= 6 ? 1/24 : locator.length >= 4 ? 0.5 : 5);

  return { lat, lon };
}
