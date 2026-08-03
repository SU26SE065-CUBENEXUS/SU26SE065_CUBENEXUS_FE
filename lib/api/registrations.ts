import { apiFetch } from './config';

export interface RegisterEventDto {
  eventId: string;
}

export interface RegisterTournamentDto {
  events: RegisterEventDto[];
}

export interface OfflineRegistrationEventDetailDto {
  id: string;
  eventId: string;
  eventName: string;
  statusCode: string;
  seedTimeMs?: number | null;
}

export interface RegistrationDetailDto {
  id: string;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  statusCode: string;
  qrToken: string;
  registeredAt: string;
  checkedInAt?: string | null;
  events: OfflineRegistrationEventDetailDto[];
}

/** POST /api/tournament-registration/tournaments/{tournamentId}/register */
export async function registerTournament(
  tournamentId: string,
  eventIds: string[]
): Promise<RegistrationDetailDto> {
  const dto: RegisterTournamentDto = {
    events: eventIds.map((id) => ({ eventId: id })),
  };
  return apiFetch<RegistrationDetailDto>(
    `/api/tournament-registration/tournaments/${tournamentId}/register`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
}

/** GET /api/me/registrations */
export async function getMyRegistrations(): Promise<RegistrationDetailDto[]> {
  return apiFetch<RegistrationDetailDto[]>('/api/me/registrations');
}

/** GET /api/me/registrations/{id} */
export async function getMyRegistrationById(id: string): Promise<RegistrationDetailDto> {
  return apiFetch<RegistrationDetailDto>(`/api/me/registrations/${id}`);
}
