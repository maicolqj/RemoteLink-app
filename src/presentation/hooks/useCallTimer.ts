// Copia de EntryLink (PhoneDialerApp): misma pantalla de llamada en las dos apps.

// =============================================================================
// ARCHIVO: src/hooks/useCallTimer.ts
// =============================================================================
//
// PASO 8.3b - HOOK DEL TIMER DE LLAMADA
//
// ¿QUÉ HACE?
// Cuenta los segundos desde que la llamada pasa a estado ACTIVE.
// Se detiene automáticamente cuando la llamada termina.
// Retorna los segundos crudos y el tiempo formateado como "MM:SS" o "HH:MM:SS".
//
// ¿CÓMO FUNCIONA?
// 1. Recibe el callState como parámetro
// 2. Cuando callState cambia a 'ACTIVE', inicia un setInterval de 1 segundo
// 3. Cada segundo incrementa el contador
// 4. Cuando callState cambia a 'DISCONNECTED' o null, detiene el interval
//
// ¿CÓMO SE USA?
//
//   function InCallScreen({ callState }) {
//     const { seconds, formattedTime } = useCallTimer(callState);
//
//     return <Text>{formattedTime}</Text>;  // "02:35"
//   }
//
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import type { IntercomCallState as CallState } from '../../infraestructure/services/intercomCall.service';

export function useCallTimer(callState: CallState | null) {
  // ---------------------------------------------------------------------------
  // ESTADO: Contador de segundos
  // ---------------------------------------------------------------------------
  const [seconds, setSeconds] = useState(0);

  // ---------------------------------------------------------------------------
  // REF: Referencia al interval
  // ---------------------------------------------------------------------------
  // Usamos useRef en vez de useState para guardar el interval porque:
  //   1. No necesitamos re-render cuando cambia el interval
  //   2. Necesitamos acceder al valor actual en el cleanup
  //   3. useRef persiste entre renders sin causar re-renders
  //
  // ReturnType<typeof setInterval> es el tipo correcto cross-platform
  // (en Node.js es NodeJS.Timeout, en browser es number)
  // ---------------------------------------------------------------------------
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // =========================================================================
    // CASO 1: La llamada se activó → Iniciar timer
    // =========================================================================
    // Cuando la llamada pasa a ACTIVE significa que ambas partes están
    // conectadas y hablando. Es el momento de empezar a contar.
    // =========================================================================
    if (callState === 'ACTIVE') {
      // Resetear el contador a 0 (por si hubo una llamada anterior)
      setSeconds(0);

      // Iniciar interval que incrementa cada segundo
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    // =========================================================================
    // CASO 2: La llamada terminó → Detener timer
    // =========================================================================
    // Cuando la llamada se desconecta o el estado es null (no hay llamada),
    // detenemos el interval.
    // NO reseteamos seconds a 0 aquí porque queremos que la pantalla
    // muestre la duración final por un momento antes de cerrar.
    // =========================================================================
    if (callState === 'DISCONNECTED' || callState === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // =========================================================================
    // CLEANUP: Limpiar interval al desmontar
    // =========================================================================
    // Si el componente se desmonta mientras el timer corre
    // (por ejemplo, si la app va a background), limpiamos el interval.
    // =========================================================================
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callState]); // Se re-ejecuta cada vez que callState cambia

  // ---------------------------------------------------------------------------
  // FORMATO DEL TIEMPO
  // ---------------------------------------------------------------------------
  // Convertimos los segundos a formato legible:
  //   65 segundos → "01:05"
  //   3661 segundos → "01:01:01"
  //
  // Usamos IIFE (() => { ... })() para calcular el valor inline.
  // ---------------------------------------------------------------------------
  const formattedTime = (() => {
    const hrs = Math.floor(seconds / 3600);         // Horas
    const mins = Math.floor((seconds % 3600) / 60); // Minutos
    const secs = seconds % 60;                       // Segundos

    // Función helper para agregar cero a la izquierda: 5 → "05"
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Si hay horas, mostrar formato largo: "01:05:30"
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }

    // Si no hay horas, mostrar formato corto: "05:30"
    return `${pad(mins)}:${pad(secs)}`;
  })();

  return { seconds, formattedTime };
}