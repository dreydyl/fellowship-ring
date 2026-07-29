// Converts human-readable Bible references (as returned by Gloo AI, e.g.
// "Hebrews 4:16" or "Philippians 4:12-13") into the USFM-style references
// required by the YouVersion Platform SDK (e.g. "HEB.4.16" or "PHP.4.12-13").

const BOOK_USFM_CODES: Record<string, string> = {
  genesis: 'GEN',
  exodus: 'EXO',
  leviticus: 'LEV',
  numbers: 'NUM',
  deuteronomy: 'DEU',
  joshua: 'JOS',
  judges: 'JDG',
  ruth: 'RUT',
  '1 samuel': '1SA',
  '2 samuel': '2SA',
  '1 kings': '1KI',
  '2 kings': '2KI',
  '1 chronicles': '1CH',
  '2 chronicles': '2CH',
  ezra: 'EZR',
  nehemiah: 'NEH',
  esther: 'EST',
  job: 'JOB',
  psalm: 'PSA',
  psalms: 'PSA',
  proverbs: 'PRO',
  ecclesiastes: 'ECC',
  'song of solomon': 'SNG',
  'song of songs': 'SNG',
  isaiah: 'ISA',
  jeremiah: 'JER',
  lamentations: 'LAM',
  ezekiel: 'EZK',
  daniel: 'DAN',
  hosea: 'HOS',
  joel: 'JOL',
  amos: 'AMO',
  obadiah: 'OBA',
  jonah: 'JON',
  micah: 'MIC',
  nahum: 'NAM',
  habakkuk: 'HAB',
  zephaniah: 'ZEP',
  haggai: 'HAG',
  zechariah: 'ZEC',
  malachi: 'MAL',
  matthew: 'MAT',
  mark: 'MRK',
  luke: 'LUK',
  john: 'JHN',
  acts: 'ACT',
  romans: 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  galatians: 'GAL',
  ephesians: 'EPH',
  philippians: 'PHP',
  colossians: 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  titus: 'TIT',
  philemon: 'PHM',
  hebrews: 'HEB',
  james: 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  jude: 'JUD',
  revelation: 'REV',
};

/**
 * Converts a reference like "Hebrews 4:16" or "Philippians 4:12-13" into
 * the USFM format expected by the YouVersion SDK, e.g. "HEB.4.16" or
 * "PHP.4.12-13". Returns null if the reference can't be parsed.
 */
export function toUsfmReference(reference: string): string | null {
  const match = reference
    .trim()
    .match(/^((?:[1-3]\s?)?[A-Za-z][A-Za-z .]*?)\s+(\d+):(\d+)(?:-(\d+))?$/);

  if (!match) return null;

  const [, rawBook, chapter, verseStart, verseEnd] = match;
  const bookKey = rawBook.trim().toLowerCase().replace(/\s+/g, ' ');
  const bookCode = BOOK_USFM_CODES[bookKey];
  if (!bookCode) return null;

  const verses = verseEnd ? `${verseStart}-${verseEnd}` : verseStart;
  return `${bookCode}.${chapter}.${verses}`;
}
