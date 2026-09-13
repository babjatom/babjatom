export type VisitRow = {
  id: number
  ipAddress: string
  hits: number
  country: string
  lastVisit: string
}

export const mockVisits: VisitRow[] = [
  {
    id: 1,
    ipAddress: '203.0.113.42',
    hits: 1284,
    country: 'United States',
    lastVisit: '2026-09-08 09:14',
  },
  {
    id: 2,
    ipAddress: '198.51.100.17',
    hits: 842,
    country: 'Germany',
    lastVisit: '2026-09-08 08:51',
  },
  {
    id: 3,
    ipAddress: '192.0.2.88',
    hits: 512,
    country: 'Japan',
    lastVisit: '2026-09-07 22:03',
  },
  {
    id: 4,
    ipAddress: '203.0.113.9',
    hits: 301,
    country: 'Brazil',
    lastVisit: '2026-09-07 19:40',
  },
  {
    id: 5,
    ipAddress: '198.51.100.201',
    hits: 176,
    country: 'Canada',
    lastVisit: '2026-09-07 16:12',
  },
  {
    id: 6,
    ipAddress: '192.0.2.44',
    hits: 95,
    country: 'Australia',
    lastVisit: '2026-09-06 23:55',
  },
  {
    id: 7,
    ipAddress: '203.0.113.77',
    hits: 64,
    country: 'France',
    lastVisit: '2026-09-06 14:28',
  },
  {
    id: 8,
    ipAddress: '198.51.100.63',
    hits: 41,
    country: 'India',
    lastVisit: '2026-09-05 11:07',
  },
]
