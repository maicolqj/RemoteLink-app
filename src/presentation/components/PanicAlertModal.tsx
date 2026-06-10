import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useLazyQuery } from '@apollo/client/react';
import apolloClientInstance from '../../data/lib/apollo/client';
import { ACKNOWLEDGE_PANIC_ALERT } from '../../domain/graphql/mutations';
import { GET_UNIT } from '../../domain/graphql/queries';
import { ValidRoles } from '../../domain/interfaces/ValidRoles';
import { useAuthStore } from '../../shared/store/auth.store';
import type { GetUnitResponseModel } from '../../domain/responses/UnitResponseModel';
import PanicSound from '../../shared/modules/PanicSoundModule';

const PANIC_ROLES = [
  ValidRoles.SECURITY_ROL,
  ValidRoles.COMPLEX_ROL,
  ValidRoles.SUPERVISOR_ROL,
  ValidRoles.RESIDENT_ROL,
] as const;

export interface PanicAlertNewPayload {
  complexId: string;
  triggeredBy: string;
  triggeredByRole?: string;
  unitId?: string;
  unitNumber?: string;
  message?: string;
}

function buildSourceLabel(data: PanicAlertNewPayload, fetchedUnitNumber?: string): string {
  const unitNum = data.unitNumber ?? fetchedUnitNumber;
  if (unitNum) return `Alerta emitida por la unidad ${unitNum}`;

  const role = data.triggeredByRole;
  if (role === ValidRoles.SECURITY_ROL)   return 'Alerta emitida por el guarda de seguridad';
  if (role === ValidRoles.RESIDENT_ROL)   return 'Alerta emitida por un residente';
  if (role === ValidRoles.ACCOUNTANT_ROL) return 'Alerta emitida por contabilidad';
  if (role) return 'Alerta emitida por administración';

  return 'Alerta emitida en el complejo';
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
  const canSee = PANIC_ROLES.some(r => hasRole(r));
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const vibrating = useRef(false);

  // Lazy unit fetch — fallback for backends that don't yet include unitNumber in payload
  const [fetchUnit, { data: unitData }] = useLazyQuery<GetUnitResponseModel>(GET_UNIT, {
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (panicData?.unitId && !panicData.unitNumber) {
      fetchUnit({ variables: { id: panicData.unitId } });
    }
  }, [panicData?.unitId, panicData?.unitNumber, fetchUnit]);

  const sourceLabel = panicData
    ? buildSourceLabel(panicData, unitData?.unit.number)
    : '';

  const visible = !!panicData && canSee;

  useEffect(() => {
    if (visible) {
      if (!vibrating.current) {
        vibrating.current = true;
        Vibration.vibrate([0, 500, 200, 500], true);
      }
      PanicSound?.start();
    } else {
      vibrating.current = false;
      Vibration.cancel();
      PanicSound?.stop();
    }

    return () => {
      vibrating.current = false;
      Vibration.cancel();
      PanicSound?.stop();
    };
  }, [visible]);

  useEffect(() => {
    if (acknowledgedData) {
      Vibration.cancel();
      vibrating.current = false;
      PanicSound?.stop();
      onAcknowledged();
    }
  }, [acknowledgedData, onAcknowledged]);

  const handleAcknowledge = useCallback(async () => {
    if (isAcknowledging || !panicData) return;
    setIsAcknowledging(true);
    try {
      await apolloClientInstance.mutate({
        mutation: ACKNOWLEDGE_PANIC_ALERT,
        variables: { complexId: panicData.complexId },
        fetchPolicy: 'no-cache',
      });
    } catch (err) {
      console.warn('[PanicAlertModal] acknowledge error:', err);
    } finally {
      setIsAcknowledging(false);
      Vibration.cancel();
      vibrating.current = false;
      PanicSound?.stop();
      onAcknowledged();
    }
  }, [panicData, isAcknowledging, onAcknowledged]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>ALERTA DE PÁNICO</Text>
          <Text style={styles.body}>{sourceLabel}</Text>
          {!!panicData?.message && (
            <Text style={styles.message}>{panicData.message}</Text>
          )}
          <TouchableOpacity
            style={[styles.button, isAcknowledging && styles.buttonDisabled]}
            onPress={handleAcknowledge}
            disabled={isAcknowledging}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isAcknowledging ? 'Reconociendo...' : 'Reconocer'}
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
    backgroundColor: 'rgba(180, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#c00',
    textAlign: 'center',
    letterSpacing: 1,
  },
  body: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#c00',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
