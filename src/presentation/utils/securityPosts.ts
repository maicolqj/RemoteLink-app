export type SecurityPostChoice = {
  id: string;
  name: string;
  phoneNumber?: string | null;
  guardsOnDuty: number;
  guardsWithApp: number;
};

/**
 * Portería preseleccionada: la que ya se había elegido si sigue existiendo; si
 * hay una sola, esa; con varias, ninguna (el residente debe elegir).
 */
export function pickSecurityPost(
  posts: ReadonlyArray<SecurityPostChoice>,
  currentId?: string,
): SecurityPostChoice | undefined {
  const current = posts.find(p => p.id === currentId);
  if (current) return current;
  return posts.length === 1 ? posts[0] : undefined;
}
