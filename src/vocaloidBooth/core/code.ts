const AMBIGUOUS = new Set(['0', '1', 'I', 'O', 'L']);
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'.split('').filter((c) => !AMBIGUOUS.has(c));

export interface GenerateMatchCodeOptions {
  length?: number;
  maxAttempts?: number;
  exists: (code: string) => Promise<boolean>;
}

export const normalizeMatchCode = (value: string): string => value.trim().toUpperCase();

export const generateMatchCode = async ({
  length = 6,
  maxAttempts = 20,
  exists,
}: GenerateMatchCodeOptions): Promise<string> => {
  if (length < 4) {
    throw new Error('Match code length must be at least 4');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = Array.from({ length })
      .map(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
      .join('');

    // eslint-disable-next-line no-await-in-loop
    if (!(await exists(code))) {
      return code;
    }
  }

  throw new Error('Unable to generate unique match code');
};
