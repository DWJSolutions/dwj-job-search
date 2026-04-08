const fetch = require('node-fetch');

// Orlando, FL baseline (default location)
const ORLANDO_DEFAULT = { lat: 28.5383, lon: -81.3792, city: 'Orlando', state: 'FL' };

/**
 * Convert ZIP code to lat/lon using Zippopotam.us (free, no key needed)
 * Falls back to OpenCage if OPENCAGE_API_KEY is set
 */
async function geocodeZip(zip) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) throw new Error('ZIP not found');
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) throw new Error('No place data');
    return {
      lat:   parseFloat(place.latitude),
      lon:   parseFloat(place.longitude),
      city:  place['place name'],
      state: place['state abbreviation'],
    };
  } catch (err) {
    console.warn('Geocode failed, using Orlando default:', err.message);
    return ORLANDO_DEFAULT;
  }
}

module.exports = { geocodeZip };
