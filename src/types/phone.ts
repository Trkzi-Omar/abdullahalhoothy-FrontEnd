import type { ParsedCountry } from 'react-international-phone';

export type PhoneCountry = ParsedCountry & {
  displayName: string;
  searchName: string;
};
