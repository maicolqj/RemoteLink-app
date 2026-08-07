/**
 * Confirmación de entrega de una alerta de pánico.
 *
 * Le dice al backend que este equipo SÍ mostró la alerta. En RemoteLink no mueve
 * el estado del incidente —eso solo lo hace la confirmación de quien debe
 * atenderlo, no la de un vecino— pero sí alimenta la auditoría de entrega, que
 * es donde se mide qué marcas de teléfono reciben los pánicos y cuáles no.
 *
 * Ese dato importa justamente aquí: el parque de equipos de los residentes es
 * mucho más heterogéneo que el de la portería, así que es donde mejor se ve si
 * el problema son ciertas ROMs.
 *
 * Quedan DOS implementaciones de esto a propósito, y la de Android ya no es
 * esta: con la app cerrada el ACK sale de PanicAckClient.kt, porque el handler
 * headless que ejecutaría este archivo no llega a arrancar (Android rechaza el
 * arranque del servicio desde segundo plano). Esta versión cubre lo que queda:
 * iOS entero, y el caso de Android con la app en primer plano, donde el pánico
 * llega por socket y el receptor nativo se aparta.
 */

import { getMessaging, getToken } from '@react-native-firebase/messaging';

export async function reportPanicDelivered(
  data: Record<string, string> | undefined,
): Promise<void> {
  const url = data?.ackUrl;
  const token = data?.ackToken;

  // Backend sin API_PUBLIC_URL configurada, o una versión anterior del payload.
  // No es un fallo del equipo: simplemente no se confirma.
  if (!url || !token) {
    // Sin esta traza el caso "no se confirmó nada" es indistinguible de "se
    // confirmó y falló": ninguno de los dos deja rastro en el equipo, y desde el
    // servidor ambos se ven igual (una alerta sin entregas registradas).
    if (__DEV__) console.log('[PanicAck] sin ackUrl/ackToken en el payload — no se confirma la entrega');
    return;
  }

  try {
    // El token del equipo es lo que permite atribuir la entrega a un dispositivo
    // y cruzarla con su marca — sin él la fila de auditoría es anónima y no
    // sirve para nada de lo que motiva esta confirmación. Está cacheado en
    // local, así que resuelve rápido.
    let deviceToken: string | undefined;
    try {
      deviceToken = await getToken(getMessaging());
    } catch {
      // Se confirma igual: media entrega registrada vale más que ninguna.
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceToken ? { token, deviceToken } : { token }),
    });
    // 204 es el éxito esperado. Cualquier otro código apunta a algo concreto:
    // 401 token vencido o firmado con otro secreto (típico si el ackUrl apunta a
    // un servidor distinto del que envió la alerta), 404 alerta inexistente.
    if (__DEV__) console.log(`[PanicAck] ${res.status} ← ${url}`);
  } catch (e) {
    // La red falló: el ackUrl no es alcanzable desde el equipo. En pruebas
    // locales casi siempre significa que apunta a localhost en vez de la IP LAN.
    if (__DEV__) console.log('[PanicAck] no se pudo confirmar:', (e as Error)?.message);
    // Sin reintento: para cuando la red vuelva, la alerta ya se habrá resuelto
    // o el servidor ya habrá escalado. Y nunca puede tumbar la alarma, que es lo
    // único que de verdad importa en este momento.
  }
}
