// ============================================================
// CubeNexus Mock Service — Competitor Group & Task Schedules
// ============================================================

export interface PlayerScheduleEntry {
  id: string;
  eventId: string;
  eventName: string;
  roundNumber: number;
  groupName: string;
  role: 'Competitor' | 'Judge' | 'Scrambler' | 'Runner';
  startTime: string;
  stationNumber?: number;
  status: 'Upcoming' | 'Active' | 'Completed';
}

const MOCK_SCHEDULES: Record<string, PlayerScheduleEntry[]> = {
  // Mock data indexed by email or user ID
  'competitor@cubenexus.com': [
    {
      id: 'sch-001',
      eventId: 'ev-333',
      eventName: '3x3x3 Cube',
      roundNumber: 1,
      groupName: 'Group A',
      role: 'Competitor',
      startTime: '09:00 AM',
      stationNumber: 4,
      status: 'Completed',
    },
    {
      id: 'sch-002',
      eventId: 'ev-222',
      eventName: '2x2x2 Cube',
      roundNumber: 1,
      groupName: 'Group B',
      role: 'Judge', // Helping out
      startTime: '11:30 AM',
      status: 'Active',
    },
    {
      id: 'sch-003',
      eventId: 'ev-333',
      eventName: '3x3x3 Cube',
      roundNumber: 2,
      groupName: 'Group A',
      role: 'Competitor',
      startTime: '01:30 PM',
      status: 'Upcoming',
    },
  ],
  'default': [
    {
      id: 'sch-101',
      eventId: 'ev-333',
      eventName: '3x3x3 Cube',
      roundNumber: 1,
      groupName: 'Group B',
      role: 'Competitor',
      startTime: '09:30 AM',
      stationNumber: 2,
      status: 'Completed',
    },
    {
      id: 'sch-102',
      eventId: 'ev-medley',
      eventName: 'Medley Relay',
      roundNumber: 1,
      groupName: 'Group A',
      role: 'Competitor',
      startTime: '02:00 PM',
      status: 'Upcoming',
    },
  ],
};

export async function getPlayerSchedule(emailOrId?: string): Promise<PlayerScheduleEntry[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  if (!emailOrId) return MOCK_SCHEDULES.default;
  return MOCK_SCHEDULES[emailOrId] || MOCK_SCHEDULES.default;
}
