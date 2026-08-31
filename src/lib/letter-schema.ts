// src/lib/letter-schema.ts
export type LetterJson = {
  salutation: string;
  intro: string;
  bullets?: string[];
  body?: string;
  closing: string;
  signatureName?: string;
  meta?: { role?: string; company?: string };
};
