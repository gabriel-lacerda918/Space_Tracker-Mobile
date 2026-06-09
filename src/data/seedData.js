// Dados simulados realistas baseados em TLE (Two-Line Element) públicos
// Fonte de referência: space-track.org / Celestrak

export const SEED_SATELLITES = [
  {
    id: 'SAT-001', name: 'StarLink-1234', constellation: 'Starlink',
    altitude: 550, inclination: 53.0, period: 95.5,
    status: 'operational', raan: 120.4, eccentricity: 0.0001,
    lat: -23.5, lon: -46.6, operator: 'SpaceX',
    launchDate: '2023-03-15', mass: 260,
  },
  {
    id: 'SAT-002', name: 'StarLink-1890', constellation: 'Starlink',
    altitude: 548, inclination: 53.0, period: 95.4,
    status: 'operational', raan: 121.1, eccentricity: 0.0001,
    lat: -22.9, lon: -43.1, operator: 'SpaceX',
    launchDate: '2023-06-20', mass: 260,
  },
  {
    id: 'SAT-003', name: 'OneWeb-0345', constellation: 'OneWeb',
    altitude: 1200, inclination: 87.9, period: 109.3,
    status: 'operational', raan: 45.2, eccentricity: 0.0002,
    lat: 15.3, lon: 32.8, operator: 'OneWeb',
    launchDate: '2022-11-10', mass: 148,
  },
  {
    id: 'SAT-004', name: 'GPS-IIF-12', constellation: 'GPS',
    altitude: 20200, inclination: 55.0, period: 718.0,
    status: 'operational', raan: 200.0, eccentricity: 0.0,
    lat: 40.7, lon: -74.0, operator: 'USAF',
    launchDate: '2016-02-05', mass: 1630,
  },
  {
    id: 'SAT-005', name: 'Amazonia-1', constellation: 'INPE',
    altitude: 752, inclination: 98.4, period: 99.8,
    status: 'warning', raan: 90.0, eccentricity: 0.001,
    lat: -2.5, lon: -44.3, operator: 'INPE',
    launchDate: '2021-02-28', mass: 637,
  },
  {
    id: 'SAT-006', name: 'StarLink-2201', constellation: 'Starlink',
    altitude: 545, inclination: 53.0, period: 95.3,
    status: 'critical', raan: 119.8, eccentricity: 0.0001,
    lat: -23.1, lon: -46.9, operator: 'SpaceX',
    launchDate: '2024-01-10', mass: 260,
  },
];

export const SEED_DEBRIS = [
  {
    id: 'DEB-001', name: 'COSMOS 954 Fragment A', origin: 'COSMOS 954',
    altitude: 552, inclination: 65.5, size: 0.12,
    riskLevel: 'high', velocity: 7.8, catalogId: '12345',
    detectedAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'DEB-002', name: 'Fengyun-1C Fragment', origin: 'FY-1C ASAT Test 2007',
    altitude: 840, inclination: 98.8, size: 0.08,
    riskLevel: 'medium', velocity: 7.5, catalogId: '29180',
    detectedAt: '2024-01-20T14:15:00Z',
  },
  {
    id: 'DEB-003', name: 'Iridium 33 Fragment', origin: 'Iridium-Cosmos Collision 2009',
    altitude: 776, inclination: 86.4, size: 0.35,
    riskLevel: 'high', velocity: 7.6, catalogId: '33446',
    detectedAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'DEB-004', name: 'SL-16 R/B Fragment', origin: 'Zenit-2 Upper Stage',
    altitude: 850, inclination: 71.0, size: 2.4,
    riskLevel: 'critical', velocity: 7.4, catalogId: '19650',
    detectedAt: '2024-02-10T22:45:00Z',
  },
  {
    id: 'DEB-005', name: 'BLITS Fragment', origin: 'BLITS Retroreflector',
    altitude: 500, inclination: 98.7, size: 0.17,
    riskLevel: 'medium', velocity: 7.9, catalogId: '35875',
    detectedAt: '2024-02-14T11:20:00Z',
  },
];

export const SEED_ALERTS = [
  {
    id: 'ALT-001',
    type: 'collision',
    severity: 'critical',
    satelliteId: 'SAT-006',
    satelliteName: 'StarLink-2201',
    debrisId: 'DEB-001',
    debrisName: 'COSMOS 954 Fragment A',
    probability: 1.8,
    timeToClosestApproach: '02:14:33',
    missDistance: 142,
    status: 'active',
    createdAt: Date.now() - 300000,
  },
  {
    id: 'ALT-002',
    type: 'conjunction',
    severity: 'warning',
    satelliteId: 'SAT-005',
    satelliteName: 'Amazonia-1',
    debrisId: 'DEB-003',
    debrisName: 'Iridium 33 Fragment',
    probability: 0.4,
    timeToClosestApproach: '06:48:10',
    missDistance: 890,
    status: 'active',
    createdAt: Date.now() - 900000,
  },
  {
    id: 'ALT-003',
    type: 'conjunction',
    severity: 'info',
    satelliteId: 'SAT-001',
    satelliteName: 'StarLink-1234',
    debrisId: 'DEB-005',
    debrisName: 'BLITS Fragment',
    probability: 0.05,
    timeToClosestApproach: '14:22:05',
    missDistance: 3200,
    status: 'monitoring',
    createdAt: Date.now() - 1800000,
  },
];
