export type ProfileValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ProfileValue[]
  | ProfileRecord;

export type ProfileRecord = Record<string, ProfileValue>;
