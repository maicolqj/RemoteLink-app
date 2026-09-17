/**
 * Una foto lista para subir por multipart.
 *
 * Vive aquí y no dentro de un módulo porque la usan varios: mascotas, la
 * evidencia de un reporte y los avisos de clasificados. El hook que abre la
 * cámara la importaba de `pets.service`, que es del módulo de mascotas: un
 * selector de fotos genérico no puede depender de qué módulo lo estrenó.
 */
export interface PhotoUpload {
  uri: string;
  type: string;
  name: string;
}
