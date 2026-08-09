export function formatEventLabel(e: {
  puzzleTypeName?: string;
  puzzleTypeCode?: string;
  eventFormatCode?: string;
  medleyPuzzles?: { puzzleTypeName?: string; puzzleTypeCode?: string }[];
}): string {
  const isMedley = (e.eventFormatCode || '').toUpperCase() === 'MEDLEY';
  const baseName = e.puzzleTypeName || e.puzzleTypeCode || '3x3x3';

  if (isMedley) {
    if (e.medleyPuzzles && e.medleyPuzzles.length > 0) {
      const subNames = e.medleyPuzzles
        .map((mp) => mp.puzzleTypeCode || mp.puzzleTypeName)
        .filter(Boolean)
        .join(' + ');
      return `Medley (${subNames})`;
    }
    return `Medley (${baseName})`;
  }

  return `${baseName} (Traditional)`;
}
