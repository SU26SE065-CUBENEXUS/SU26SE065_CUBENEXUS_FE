export type CubeFaceState = {
  [face in 'U' | 'D' | 'F' | 'B' | 'R' | 'L']: string[][];
};

export const COLOR_HEX_MAP: Record<string, string> = {
  white: '#f8fafc',
  yellow: '#facc15',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  orange: '#fb923c',
};

export const FACE_LABEL_EN: Record<string, { label: string; center: string }> = {
  U: { label: 'Top Face (Up)', center: 'White' },
  D: { label: 'Bottom Face (Down)', center: 'Yellow' },
  F: { label: 'Front Face (Front)', center: 'Green' },
  B: { label: 'Back Face (Back)', center: 'Blue' },
  R: { label: 'Right Face (Right)', center: 'Red' },
  L: { label: 'Left Face (Left)', center: 'Orange' },
};

export function simulateScramble(scramble: string): CubeFaceState {
  const state: CubeFaceState = {
    U: Array.from({ length: 3 }, () => Array(3).fill('white')),
    D: Array.from({ length: 3 }, () => Array(3).fill('yellow')),
    F: Array.from({ length: 3 }, () => Array(3).fill('green')),
    B: Array.from({ length: 3 }, () => Array(3).fill('blue')),
    R: Array.from({ length: 3 }, () => Array(3).fill('red')),
    L: Array.from({ length: 3 }, () => Array(3).fill('orange')),
  };

  if (!scramble) return state;

  const moves = scramble.trim().split(/\s+/);
  for (const move of moves) {
    if (!move) continue;
    const face = move[0].toUpperCase();
    if (!['U', 'D', 'F', 'B', 'R', 'L'].includes(face)) continue;

    const turns = move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1;
    for (let i = 0; i < turns; i++) {
      applyQuarterTurn(state, face as 'U' | 'D' | 'F' | 'B' | 'R' | 'L');
    }
  }

  return state;
}

function applyQuarterTurn(s: CubeFaceState, face: 'U' | 'D' | 'F' | 'B' | 'R' | 'L') {
  // Rotate face grid 90 deg clockwise
  const f = s[face];
  const oldF = f.map((r) => [...r]);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      f[r][c] = oldF[2 - c][r];
    }
  }

  if (face === 'U') {
    const tmp = [...s.F[0]];
    s.F[0] = [...s.R[0]];
    s.R[0] = [...s.B[0]];
    s.B[0] = [...s.L[0]];
    s.L[0] = tmp;
  } else if (face === 'D') {
    const tmp = [...s.F[2]];
    s.F[2] = [...s.L[2]];
    s.L[2] = [...s.B[2]];
    s.B[2] = [...s.R[2]];
    s.R[2] = tmp;
  } else if (face === 'F') {
    const tmp = [s.U[2][0], s.U[2][1], s.U[2][2]];
    s.U[2][0] = s.L[2][2]; s.U[2][1] = s.L[1][2]; s.U[2][2] = s.L[0][2];
    s.L[0][2] = s.D[0][0]; s.L[1][2] = s.D[0][1]; s.L[2][2] = s.D[0][2];
    s.D[0][0] = s.R[2][0]; s.D[0][1] = s.R[1][0]; s.D[0][2] = s.R[0][0];
    s.R[0][0] = tmp[0]; s.R[1][0] = tmp[1]; s.R[2][0] = tmp[2];
  } else if (face === 'B') {
    const tmp = [s.U[0][0], s.U[0][1], s.U[0][2]];
    s.U[0][0] = s.R[0][2]; s.U[0][1] = s.R[1][2]; s.U[0][2] = s.R[2][2];
    s.R[0][2] = s.D[2][2]; s.R[1][2] = s.D[2][1]; s.R[2][2] = s.D[2][0];
    s.D[2][0] = s.L[0][0]; s.D[2][1] = s.L[1][0]; s.D[2][2] = s.L[2][0];
    s.L[0][0] = tmp[2]; s.L[1][0] = tmp[1]; s.L[2][0] = tmp[0];
  } else if (face === 'R') {
    const tmp = [s.U[0][2], s.U[1][2], s.U[2][2]];
    s.U[0][2] = s.F[0][2]; s.U[1][2] = s.F[1][2]; s.U[2][2] = s.F[2][2];
    s.F[0][2] = s.D[0][2]; s.F[1][2] = s.D[1][2]; s.F[2][2] = s.D[2][2];
    s.D[0][2] = s.B[2][0]; s.D[1][2] = s.B[1][0]; s.D[2][2] = s.B[0][0];
    s.B[0][0] = tmp[2]; s.B[1][0] = tmp[1]; s.B[2][0] = tmp[0];
  } else if (face === 'L') {
    const tmp = [s.U[0][0], s.U[1][0], s.U[2][0]];
    s.U[0][0] = s.B[2][2]; s.U[1][0] = s.B[1][2]; s.U[2][0] = s.B[0][2];
    s.B[0][2] = s.D[2][0]; s.B[1][2] = s.D[1][0]; s.B[2][2] = s.D[0][0];
    s.D[0][0] = s.F[0][0]; s.D[1][0] = s.F[1][0]; s.D[2][0] = s.F[2][0];
    s.F[0][0] = tmp[0]; s.F[1][0] = tmp[1]; s.F[2][0] = tmp[2];
  }
}
