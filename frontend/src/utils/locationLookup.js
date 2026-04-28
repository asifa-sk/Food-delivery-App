const geocodeCache = new Map();

export async function geocodeAddress(address) {
  const query = String(address || '').trim();
  if (!query) {
    return null;
  }

  if (geocodeCache.has(query)) {
    return geocodeCache.get(query);
  }

  const request = fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Address lookup failed');
      }

      const data = await response.json();
      const match = Array.isArray(data) ? data[0] : null;
      const latitude = Number(match?.lat);
      const longitude = Number(match?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        label: query,
      };
    })
    .catch((error) => {
      console.error('address geocoding failed', error);
      return null;
    });

  geocodeCache.set(query, request);
  return request;
}
