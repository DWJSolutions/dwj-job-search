const fetch = require('node-fetch');

const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC',
};

function locationError(message) {
  const err = new Error(message);
  err.code = 'LOCATION_NOT_FOUND';
  return err;
}

/**
 * Convert a US ZIP code or city/state string to lat/lon.
 * ZIPs use Zippopotam.us and are cached in-process for 30 days.
 * City/state support remains for internal compatibility.
 */
const zipCache = new Map();
const ZIP_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function geocodeLocation(input) {
  const query = String(input || '').trim();
  if (!query) throw locationError('Please enter a valid 5-digit ZIP code.');

  if (/^\d{5}$/.test(query)) {
    const cached = zipCache.get(query);
    if (cached && Date.now() - cached.cachedAt < ZIP_CACHE_TTL_MS) return cached.value;

    const res = await fetch(`https://api.zippopotam.us/us/${query}`);
    if (!res.ok) throw locationError('ZIP code was not found. Try a valid US ZIP code.');
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) throw locationError('ZIP code was not found. Try a valid US ZIP code.');
    const value = {
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude),
      city: place['place name'],
      state: place['state abbreviation'],
      label: `${place['place name']}, ${place['state abbreviation']}`,
    };
    zipCache.set(query, { value, cachedAt: Date.now() });
    return value;
  }

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'us',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DWJ Job Search location lookup',
    },
  });
  if (!res.ok) throw locationError('Could not look up that city. Try a city and state, like Orlando, FL.');

  const data = await res.json();
  const match = data[0];
  if (!match) throw locationError('Could not look up that city. Try a city and state, like Orlando, FL.');

  const address = match.address || {};
  const city = address.city || address.town || address.village || address.hamlet || query.split(',')[0].trim();
  const state = address.state_code || STATE_ABBR[(address.state || '').toLowerCase()] || address.state || '';

  return {
    lat: parseFloat(match.lat),
    lon: parseFloat(match.lon),
    city,
    state,
    label: state ? `${city}, ${state}` : city,
  };
}

module.exports = { geocodeLocation, geocodeZip: geocodeLocation };
