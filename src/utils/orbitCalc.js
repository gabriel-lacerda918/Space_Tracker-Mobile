// Simplified orbit calculation utilities
// Based on SGP4 simplified model for LEO satellites

const MU = 398600.4418; // Earth gravitational parameter km³/s²
const RE = 6371.0;       // Earth radius km

export function altitudeToVelocity(altKm) {
  const r = RE + altKm;
  return Math.sqrt(MU / r); // km/s
}

export function altitudeToPeriod(altKm) {
  const r = RE + altKm;
  return (2 * Math.PI * Math.pow(r, 1.5)) / Math.sqrt(MU) / 60; // minutes
}

export function calcMissDistance(sat, debris) {
  // Simplified coplanar miss distance in km
  const dAlt = Math.abs(sat.altitude - debris.altitude);
  const dInc = Math.abs(sat.inclination - debris.inclination);
  return Math.sqrt(dAlt * dAlt + (dInc * 111) * (dInc * 111));
}

export function calcCollisionProbability(missDistanceKm, relVelocityKms = 7.5) {
  // Hard-body radius assumption ~5m each = 10m combined
  const hardBodyRadius = 0.01; // km
  if (missDistanceKm < hardBodyRadius) return 100.0;
  if (missDistanceKm > 5000) return 0.0;
  // Simplified Gaussian model
  const sigma = missDistanceKm / 3;
  const prob = Math.exp(-(missDistanceKm * missDistanceKm) / (2 * sigma * sigma));
  return Math.min(parseFloat((prob * 10).toFixed(4)), 100);
}

export function getOrbitType(altKm) {
  if (altKm < 2000) return 'LEO';
  if (altKm < 35786) return 'MEO';
  if (altKm < 35887) return 'GEO';
  return 'HEO';
}

export function getSatellitePosition(sat, timeOffsetMin = 0) {
  // Simplified circular orbit propagation
  const period = altitudeToPeriod(sat.altitude);
  const angularVelocity = 360 / period; // deg/min
  const deltaLon = angularVelocity * timeOffsetMin;
  return {
    lat: sat.lat + Math.sin(((sat.inclination * Math.PI) / 180) * timeOffsetMin * 0.01) * 5,
    lon: ((sat.lon + deltaLon + 180) % 360) - 180,
  };
}

export function formatMissDistance(km) {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export function riskColor(level) {
  switch (level) {
    case 'critical': return '#FF2D2D';
    case 'high':     return '#FF6B2D';
    case 'warning':  return '#FFB800';
    case 'medium':   return '#FFB800';
    case 'info':     return '#00D4FF';
    case 'low':      return '#00FF94';
    default:         return '#8B9BB4';
  }
}

export function statusColor(status) {
  switch (status) {
    case 'operational': return '#00FF94';
    case 'warning':     return '#FFB800';
    case 'critical':    return '#FF2D2D';
    case 'inactive':    return '#8B9BB4';
    default:            return '#8B9BB4';
  }
}
