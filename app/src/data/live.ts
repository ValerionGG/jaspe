// Dernier état connu de chaque collection (alimenté par store.ts), lu par les fonctions utilitaires synchrones.
export const live: Record<string, Array<{ id: string }> | undefined> = {}
