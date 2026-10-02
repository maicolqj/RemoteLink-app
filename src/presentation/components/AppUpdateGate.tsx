// =============================================================================
// Puerta de actualización: ofrece las actualizaciones normales de Play y, si
// el backend exige una versión mínima, tapa la app hasta que se actualice.
//
// Es una capa encima de la app y no la reemplaza: lo que corre debajo (socket,
// notificaciones, alarma de pánico) sigue vivo mientras el usuario actualiza.
// No depende del tema ni de la navegación para funcionar aunque esos fallen.
// =============================================================================

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAppUpdate } from '../hooks/useAppUpdate';

const PRIMARY = '#1E40AF';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const DEFAULT_MESSAGE =
  'Hicimos cambios importantes y esta versión ya no es compatible. Actualiza la app para seguir usándola.';

export function AppUpdateGate({ children }: { children: React.ReactNode }) {
  const { required, startRequiredUpdate, versionName } = useAppUpdate('REMOTELINK');
  const [opening, setOpening] = useState(false);

  const update = async () => {
    setOpening(true);
    try {
      await startRequiredUpdate();
    } finally {
      setOpening(false);
    }
  };

  return (
    <>
      {children}
      <Modal
        visible={!!required}
        animationType="fade"
        statusBarTranslucent
        // Atrás no la cierra: sin actualizar no se puede seguir.
        onRequestClose={() => {}}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={st.container}>
          <View style={st.iconWrap}>
            <Icon name="system-update" size={48} color={PRIMARY} />
          </View>
          <Text style={st.title}>Actualiza RemoteLink</Text>
          <Text style={st.message}>{required?.message || DEFAULT_MESSAGE}</Text>
          <TouchableOpacity
            style={[st.button, opening && st.buttonDisabled]}
            onPress={update}
            disabled={opening}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {opening ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={st.buttonText}>Actualizar ahora</Text>
            )}
          </TouchableOpacity>
          <Text style={st.version}>Versión instalada {versionName}</Text>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(30,64,175,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 15, lineHeight: 22, color: MUTED, textAlign: 'center', marginBottom: 32 },
  button: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  version: { marginTop: 20, fontSize: 12, color: MUTED },
});
