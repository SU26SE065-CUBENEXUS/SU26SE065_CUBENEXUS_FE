import { apiFetch } from '@/lib/api/config';

export type ScrambleMode = 'ONLINE_MATCH' | 'OFFLINE' | 'ONLINE_ASYNC';
export type ScrambleStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'USED' | 'RETIRED' | 'INVALID';
export interface ScramblePoolItem {
  id: string; competitionMode: ScrambleMode; puzzleTypeId: string; puzzleCode: string;
  puzzleName: string; sequence: string; status: ScrambleStatus; isValidated: boolean;
  generatorName: string; notes?: string; createdAt: string; approvedAt?: string;
  assignedTargetType?: string; assignedTargetId?: string; assignedAt?: string;
  queuePosition?: number;
}
export interface ScrambleSummary { competitionMode: ScrambleMode; puzzleTypeId: string; puzzleCode: string; status: ScrambleStatus; count: number }
export interface ScramblePage { items: ScramblePoolItem[]; total: number; page: number; pageSize: number }

export const getScrambleSummary = () => apiFetch<ScrambleSummary[]>('/api/admin/scrambles/summary');
export async function getScrambles(params: { mode?: string; status?: string; puzzleTypeId?: string; pageSize?: number }) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value != null && value !== '' && q.set(key, String(value)));
  return apiFetch<ScramblePage>(`/api/admin/scrambles?${q}`);
}
export const generateScrambles = (body: { competitionMode: ScrambleMode; puzzleTypeId: string; count: number; notes?: string; autoApprove: boolean }) =>
  apiFetch<ScramblePoolItem[]>('/api/admin/scrambles/generate', { method: 'POST', body: JSON.stringify(body) });
export const importScrambles = (body: { competitionMode: ScrambleMode; puzzleTypeId: string; sequences: string[]; notes?: string }) =>
  apiFetch<ScramblePoolItem[]>('/api/admin/scrambles/import', { method: 'POST', body: JSON.stringify(body) });
export const approveScramble = (id: string) => apiFetch<ScramblePoolItem>(`/api/admin/scrambles/${id}/approve`, { method: 'POST' });
export const retireScramble = (id: string) => apiFetch<ScramblePoolItem>(`/api/admin/scrambles/${id}/retire`, { method: 'POST' });
export const getScrambleMode = () => apiFetch<{ mode: 'MANUAL' | 'AUTO' }>('/api/admin/scrambles/mode');
export const setScrambleMode = (mode: 'MANUAL' | 'AUTO') => apiFetch<{ mode: 'MANUAL' | 'AUTO' }>('/api/admin/scrambles/mode', { method: 'POST', body: JSON.stringify({ mode }) });

