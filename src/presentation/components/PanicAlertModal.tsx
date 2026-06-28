import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLazyQuery } from '@apollo/client/react';
import apolloClientInstance from '../../data/lib/apollo/client';
import { ACKNOWLEDGE_PANIC_ALERT } from '../../domain/graphql/panic.mutations';
import { GET_UNIT, ACTIVE_PANIC_ALERTS } from '../../domain/graphql/panic.queries';
import { GET_RESIDENT_BY_USER_ID } from '../../domain/graphql/panic-legacy';
import { ValidRoles } from '../../domain/interfaces/ValidRoles';
import { useAuthStore } from '../store/auth.store';
import type { GetUnitResponseModel, GetResidentByUserIdResponseModel } from '../../domain/responses/UnitResponseModel';
import PanicSound from '../../shared/modules/PanicSoundModule';


const PANIC_ROLES = [
  ValidRoles.SECURITY_ROL,
  ValidRoles.COMPLEX_ROL,
  ValidRoles.SUPERVISOR_ROL,
  ValidRoles.RESIDENT_ROL,
] as const;

// Handles both enum VALUE ('SECURITY') and KEY ('SECURITY_ROL') from backend
function roleLabel(role?: string): string {
  const r = role?.toUpperCase() ?? '';
  if (r === 'SECURITY' || r === 'SECURITY_ROL')           return 'Guarda de seguridad';
  if (r === 'RESIDENT' || r === 'RESIDENT_ROL')           return 'Residente';
  if (r === 'COMPLEX_ADMIN' || r === 'COMPLEX_ROL')       return 'Administración';
  if (r === 'SUPERVISOR' || r === 'SUPERVISOR_ROL')       return 'Supervisor';
  if (r === 'ACCOUNTANT' || r === 'ACCOUNTANT_ROL')       return 'Contabilidad';
  if (r) return role!;                                     // unknown role → show raw value
  return 'Usuario del complejo';
}

export interface PanicAlertNewPayload {
  complexId: string;
  triggeredBy: string;
  triggeredByLabel?: string;
  triggeredByName?: string;
  triggeredByRole?: string;
  unitId?: string;
  unitNumber?: string;
  floor?: number;
  buildingName?: string;
  phoneNumber?: string;
  message?: string;
}

export interface PanicAlertAcknowledgedPayload {
  id: string;
  complexId: string;
}

interface Props {
  panicData: PanicAlertNewPayload | null;
  acknowledgedData: PanicAlertAcknowledgedPayload | null;
  onAcknowledged: () => void;
}

export function PanicAlertModal({ panicData, acknowledgedData, onAcknowledged }: Props) {
  const hasRole = useAuthStore(s => s.hasRole);
  const canSee  = PANIC_ROLES.some(r => hasRole(r));
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Fetch unit details when only unitId is provided
  const [fetchUnit, { data: unitData }] = useLazyQuery<GetUnitResponseModel>(GET_UNIT, {
    fetchPolicy: 'cache-first',
  });

  // Fetch triggerer's resident profile to show name + unit
  const [fetchResident, { data: residentData }] = useLazyQuery<GetResidentByUserIdResponseModel>(
    GET_RESIDENT_BY_USER_ID,
    { fetchPolicy: 'cache-first', onError: () => {} }, // silent fail if query doesn't exist
  );

  useEffect(() => {
    if (!panicData) return;

    if (panicData.unitId && !panicData.unitNumber) {
      fetchUnit({ variables: { id: panicData.unitId } });
    }
    // Fetch profile only for residents (guards/admins likely aren't in residentByUserId)
    const role = panicData.triggeredByRole?.toUpperCase() ?? '';
    const isResident = role === 'RESIDENT' || role === 'RESIDENT_ROL' || !role;
    if (panicData.triggeredBy && !panicData.triggeredByName && isResident) {
      fetchResident({ variables: { userId: panicData.triggeredBy } });
    }
  }, [panicData?.triggeredBy, panicData?.unitId, fetchUnit, fetchResident]);

  const visible = !!panicData && canSee;

  const stopAll = useCallback(() => {
    blinkLoop.current?.stop();
    blinkLoop.current = null;
    // Stops the native alarm service (tone + vibration + ongoing notification).
    PanicSound?.stop();
  }, []);

  useEffect(() => {
    if (visible) {
      // Starts/keeps the native alarm service. Idempotent: if it's already blaring
      // (e.g. launched by the FCM handler from a killed state), this is a no-op.
      PanicSound?.start();
      blinkAnim.setValue(1);
      blinkLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.15, duration: 250, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1,   duration: 250, useNativeDriver: true }),
        ]),
      );
      blinkLoop.current.start();
    } else {
      stopAll();
    }
    return stopAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (acknowledgedData && panicData) {
      stopAll();
      onAcknowledged();
    }
  }, [acknowledgedData, panicData, onAcknowledged, stopAll]);

  // Backend acknowledgePanicAlert needs the notification id, which the socket
  // payload doesn't carry — resolve the newest active alert first. Acking one
  // clears all sibling records of the same panic event server-side.
  const handleAcknowledge = useCallback(async () => {
    if (isAcknowledging || !panicData) return;
    setIsAcknowledging(true);
    try {
      const { data } = await apolloClientInstance.query<{ activePanicAlerts: { id: string }[] }>({
        query: ACTIVE_PANIC_ALERTS,
        variables: { complexId: panicData.complexId },
        fetchPolicy: 'network-only',
      });
      const alertId = data?.activePanicAlerts?.[0]?.id;
      if (alertId) {
        await apolloClientInstance.mutate({
          mutation: ACKNOWLEDGE_PANIC_ALERT,
          variables: { notificationId: alertId },
          fetchPolicy: 'no-cache',
        });
      }
    } catch (err) {
      console.warn('[PanicAlertModal] acknowledge error:', err);
    } finally {
      setIsAcknowledging(false);
      stopAll();
      onAcknowledged();
    }
  }, [panicData, isAcknowledging, onAcknowledged, stopAll]);

  if (!visible || !panicData) return null;

  // Resolve identity: payload name > fetched profile > role label
  const resident    = residentData?.residentByUserId;
  const fullName    = panicData.triggeredByName
    ?? (resident ? `${resident.user.name} ${resident.user.lastName}` : undefined);
  const phone       = panicData.phoneNumber ?? resident?.user.phoneNumber;

  // Resolve location: payload fields > fetched unit > resident's own unit
  const unitNumber   = panicData.unitNumber  ?? resident?.unit.number  ?? unitData?.unit.number;
  const floor        = panicData.floor       ?? resident?.unit.floor   ?? unitData?.unit.floor;
  const buildingName = panicData.buildingName
    ?? resident?.unit.building?.name
    ?? unitData?.unit.building?.name;

  const hasLocation = !!(unitNumber || floor != null || buildingName);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlayBg, { opacity: blinkAnim }]} />

        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Icon name="warning" size={26} color="#fff" />
            <Text style={styles.headerTitle}>ALERTA DE PÁNICO</Text>
          </View>

          <View style={styles.body}>
            {/* Who */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="person" size={20} color="#c00" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Alarma emitida por</Text>
                <Text style={styles.infoValue}>
                  {panicData.triggeredByLabel
                    ?? fullName
                    ?? roleLabel(panicData.triggeredByRole)}
                </Text>
              </View>
            </View>

            {/* Location */}
            {hasLocation && (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Icon name="location-on" size={20} color="#c00" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  {buildingName ? (
                    <Text style={styles.infoValue}>{buildingName}</Text>
                  ) : null}
                  <Text style={[styles.infoValue, !buildingName && { marginTop: 0 }]}>
                    {[
                      unitNumber  ? `Unidad ${unitNumber}`  : null,
                      floor != null ? `Piso ${floor}` : null,
                    ].filter(Boolean).join('  ·  ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Phone */}
            {!!phone && (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Icon name="phone" size={20} color="#c00" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{phone}</Text>
                </View>
              </View>
            )}

            {/* Message */}
            {!!panicData.message && (
              <View style={styles.messageBox}>
                <Icon name="chat-bubble" size={14} color="#c00" style={{ marginTop: 1 }} />
                <Text style={styles.messageText}>"{panicData.message}"</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isAcknowledging && styles.buttonDisabled]}
            onPress={handleAcknowledge}
            disabled={isAcknowledging}
            activeOpacity={0.8}
          >
            <Icon name="check-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isAcknowledging ? 'Reconociendo...' : 'Reconocer alerta'}
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </Modal>
  );

}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayBg: {
    backgroundColor: 'rgba(180, 0, 0, 0.88)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: '#c00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  body: {
    paddingVertical: 12,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
  },
  infoSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#c00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#c00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    margin: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
