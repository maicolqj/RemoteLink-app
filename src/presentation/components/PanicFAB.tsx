import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from '@apollo/client/react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TRIGGER_PANIC_ALERT } from '../../domain/graphql/panic.mutations';
import { useAuthStore } from '../store/auth.store';
import { useAlert } from '../providers/context/AlertContext';
import { useCoachmarkTarget } from '../providers/context/CoachmarkContext';
import { PanicTriggerModal } from './PanicTriggerModal';

const FAB_SIZE = 56;
const PULSE_SIZE = FAB_SIZE + 20;
const DELAY_LONG_PRESS = 600;

export function PanicFAB() {
  const resident = useAuthStore(s => s.resident);
  const { showInfo } = useAlert();
  const [modalVisible, setModalVisible] = useState(false);
  // First-run walkthrough target (the tour itself lives in HomeScreen).
  const coachRef = useCoachmarkTarget('home.panic');

  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const pulseScale  = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale,   { toValue: 1.45, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseScale,   { toValue: 1,    duration: 0,    useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.35, duration: 0,    useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseScale, pulseOpacity]);

  const [triggerPanic, { loading }] = useMutation(TRIGGER_PANIC_ALERT);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.88, friction: 10, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 10, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    showInfo('Mantén presionado el botón rojo para activar la alerta de pánico.', 'Alerta de emergencia', {
      duration: 2500,
      position: 'top',
    });
  }, [showInfo]);

  const handleLongPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  // Backend triggerPanicAlert only takes complexId — routing and labels are
  // derived server-side from the authenticated user's role/unit.
  const handleConfirm = useCallback(async (_message: string) => {
    if (!resident?.complex?.id) return;
    try {
      await triggerPanic({
        variables: { complexId: resident.complex.id },
      });
    } catch (err) {
      console.warn('[PanicFAB] trigger error:', err);
    } finally {
      setModalVisible(false);
    }
  }, [resident, triggerPanic]);

  const handleCancel = useCallback(() => setModalVisible(false), []);

  return (
    <>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pulse,
            { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          ]}
        />
        <TouchableOpacity
          ref={coachRef}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={DELAY_LONG_PRESS}
          activeOpacity={0.85}
          accessibilityLabel="Botón de pánico. Mantén presionado para activar la alerta de emergencia."
          accessibilityRole="button"
        >
          <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
            <Icon name="warning" size={26} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <PanicTriggerModal
        visible={modalVisible}
        loading={loading}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
}

const BOTTOM = Platform.OS === 'ios' ? 100 : 80;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom:   BOTTOM,
    right:    16,
    width:    PULSE_SIZE,
    height:   PULSE_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:    10,
    elevation: 10,
  },
  pulse: {
    position:     'absolute',
    width:        PULSE_SIZE,
    height:       PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: '#DC2626',
  },
  fab: {
    width:        FAB_SIZE,
    height:       FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#DC2626',
    alignItems:     'center',
    justifyContent: 'center',
    elevation:    10,
    shadowColor:  '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  8,
  },
});
