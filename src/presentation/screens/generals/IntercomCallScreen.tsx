// =============================================================================
// Llamada con portería por la app (citofonía por internet).
//
// Mismo diseño que las pantallas de llamada de EntryLink (entrante y en curso),
// en una sola pantalla: mientras suena muestra Rechazar / Contestar; ya
// contestada, Silenciar / Altavoz / En espera y el botón rojo de colgar.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { CallActionButton } from '../../components/calls/CallActionButton';
import { useCallTimer } from '../../hooks/useCallTimer';
import {
  intercomCallService,
  type IntercomCallInfo,
} from '../../../infraestructure/services/intercomCall.service';

const END_LABEL: Record<string, string> = {
  REJECTED: 'Llamada rechazada',
  MISSED: 'Nadie contestó',
  CANCELLED: 'Llamada cancelada',
  ANSWERED_ELSEWHERE: 'Contestada en otro equipo',
};

export default function IntercomCallScreen() {
  const navigation = useNavigation();
  const [call, setCall] = useState<IntercomCallInfo | null>(() => intercomCallService.getCall());
  const [busy, setBusy] = useState(false);
  const closedRef = useRef(false);

  useEffect(() => intercomCallService.subscribe(setCall), []);

  // La llamada terminó (o no había ninguna): se muestra el motivo un instante y
  // se vuelve a donde estaba.
  useEffect(() => {
    if (closedRef.current) return;
    if (call && call.state !== 'DISCONNECTED') return;
    closedRef.current = true;
    const timer = setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
    }, call ? 1200 : 0);
    return () => clearTimeout(timer);
  }, [call, navigation]);

  const { formattedTime } = useCallTimer(call?.state ?? null);

  const run = async (action: () => Promise<void> | void) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (__DEV__) console.warn('[IntercomCall] acción falló:', err);
    } finally {
      setBusy(false);
    }
  };

  const state = call?.state;
  const stateLabel = (() => {
    switch (state) {
      case 'RINGING': return 'Llamada entrante...';
      case 'DIALING': return 'Llamando...';
      case 'CONNECTING': return 'Conectando...';
      case 'ACTIVE': return formattedTime;
      case 'HOLDING': return 'En espera';
      case 'DISCONNECTED': return END_LABEL[call?.endReason ?? ''] ?? 'Llamada finalizada';
      default: return '';
    }
  })();

  const ringing = state === 'RINGING' && call?.isIncoming;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          {busy && ringing
            ? <ActivityIndicator size="large" color="#55C2DA" />
            : <Icon name="security" size={60} color="#8E8E93" />}
        </View>
        <Text style={styles.callerName}>{call?.displayName ?? 'Portería'}</Text>
        {!!call?.subtitle && <Text style={styles.callerUnit}>{call.subtitle}</Text>}
        <Text style={styles.stateLabel}>{stateLabel}</Text>
      </View>

      {ringing ? (
        // ── Suena: Rechazar / Contestar (como IncomingCallScreen) ───────────
        <View style={styles.actionsContainer}>
          <View style={styles.actionWrapper}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => run(() => intercomCallService.reject())}
              disabled={busy}
              activeOpacity={0.7}
              accessibilityLabel="Rechazar">
              <Icon name="call-end" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Rechazar</Text>
          </View>
          <View style={styles.actionWrapper}>
            <TouchableOpacity
              style={[styles.actionButton, styles.answerButton]}
              onPress={() => run(() => intercomCallService.answer())}
              disabled={busy}
              activeOpacity={0.7}
              accessibilityLabel="Contestar">
              <Icon name="call" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Contestar</Text>
          </View>
        </View>
      ) : (
        // ── En curso: controles y colgar (como InCallScreen) ─────────────────
        <>
          <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
              <CallActionButton
                iconName="mic-off"
                label="Silenciar"
                onPress={() => intercomCallService.toggleMute()}
                isActive={!!call?.muted}
              />
              <CallActionButton
                iconName="volume-up"
                label="Altavoz"
                onPress={() => intercomCallService.toggleSpeaker()}
                isActive={!!call?.speakerOn}
              />
              <CallActionButton
                iconName="pause"
                label="En espera"
                onPress={() => intercomCallService.toggleHold()}
                isActive={!!call?.onHold}
              />
            </View>
          </View>
          <View style={styles.endCallContainer}>
            <CallActionButton
              iconName="call-end"
              label=""
              onPress={() => run(() => intercomCallService.hangUp())}
              isDestructive
              size={70}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// Mismos colores y medidas que las pantallas de llamada de EntryLink.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E', justifyContent: 'space-between', paddingVertical: 40 },
  callerInfo: { alignItems: 'center', paddingTop: 50 },
  avatar: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#3A3A3C',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  callerName: { fontSize: 28, fontWeight: '300', color: '#FFFFFF', marginBottom: 8, textAlign: 'center', paddingHorizontal: 24 },
  callerUnit: { fontSize: 16, color: '#55C2DA', marginBottom: 6 },
  stateLabel: { fontSize: 16, color: '#8E8E93', marginTop: 4 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 50, paddingBottom: 40 },
  actionWrapper: { alignItems: 'center' },
  actionButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  rejectButton: { backgroundColor: '#FF3B30' },
  answerButton: { backgroundColor: '#34C759' },
  actionLabel: { color: '#FFFFFF', fontSize: 14, marginTop: 10 },
  controlsContainer: { paddingHorizontal: 20 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  endCallContainer: { alignItems: 'center', paddingBottom: 40 },
});
