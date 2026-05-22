export const hasAuthCredentials = (auth: unknown): auth is { localId: string; idToken: string } => {
  return auth && typeof auth === 'object' && 'localId' in auth && 'idToken' in auth;
};
