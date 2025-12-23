function locatorToLatLon(locator) {
  if (!locator || locator.length < 4) return { lat: 0, lon: 0 };

  locator = locator.toUpperCase();

  const A = 'A'.charCodeAt(0);

  const lon = (locator.charCodeAt(0) - A) * 20
            + (locator.charCodeAt(2) - 48) * 2
            + (locator.charCodeAt(4) - A) / 12
            - 180 + 1/12;

  const lat = (locator.charCodeAt(1) - A) * 10
            + (locator.charCodeAt(3) - 48)
            + (locator.charCodeAt(5) - A) / 24
            - 90 + 1/24;

  return { lat, lon };
}
