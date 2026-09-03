export const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "BhopalCivicConnect/1.0 (student project)" },
  });
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = await res.json();
  return data.display_name || null;
};