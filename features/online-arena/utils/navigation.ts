import { NextUiState } from '../types';

export function routeForNextUiState(matchId: string, nextUiState: NextUiState): string {
  switch (nextUiState) {
    case 'SETUP':
      return `/online/match/${matchId}/setup`;
    case 'SCRAMBLE_CHECK':
      return `/online/match/${matchId}/scramble`;
    case 'COUNTDOWN':
      return `/online/match/${matchId}/countdown`;
    case 'INSPECTION':
      return `/online/match/${matchId}/inspection`;
    case 'SOLVING':
      return `/online/match/${matchId}/solving`;
    case 'FINISH_SCANNING':
      return `/online/match/${matchId}/finish`;
    case 'RETRY_SCAN':
      return `/online/match/${matchId}/finish`;
    case 'WAITING_OPPONENT':
      return `/online/match/${matchId}/waiting`;
    case 'NEEDS_REVIEW':
      return `/online/match/${matchId}/review`;
    case 'COMPLETED':
      return `/online/match/${matchId}/result`;
    default:
      return `/online/match/${matchId}/setup`;
  }
}
