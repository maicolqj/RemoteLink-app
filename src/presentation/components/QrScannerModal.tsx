import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

type PermissionState = 'checking' | 'granted' | 'denied';

/** Lo que entrega la cámara al leer. El paquete no exporta este tipo. */
type ReadCodeEvent = { nativeEvent: { codeStringValue?: string } };

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Se llama UNA sola vez por apertura, con el contenido del código. */
  onRead: (code: string) => void;
  title?: string;
  hint?: string;
}

/**
 * Lector de códigos QR a pantalla completa.
 *
 * El escaneo se cierra con la PRIMERA lectura. La cámara dispara `onReadCode`
 * muchas veces por segundo mientras el código siga encuadrado, y sin el
 * pestillo el formulario de atrás recibiría el mismo código treinta veces y
 * consultaría el servidor otras tantas.
 *
 * El pestillo es un ref y no un estado: entre que se llama `setState` y React
 * vuelve a pintar caben varias lecturas más, y para entonces el daño ya está
 * hecho.
 */
export function QrScannerModal({ visible, onClose, onRead, title, hint }: Props) {
  const { colors } = useTheme();
  const [permission, setPermission] = useState<PermissionState>('checking');
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) return;
    handled.current = false;

    if (Platform.OS !== 'android') {
      // En iOS el permiso lo pide el sistema al montar la cámara.
      setPermission('granted');
      return;
    }

    let alive = true;
    setPermission('checking');
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
      .then(result => {
        if (!alive) return;
        setPermission(
          result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
        );
      })
      .catch(() => alive && setPermission('denied'));

    return () => {
      alive = false;
    };
  }, [visible]);

  const handleRead = useCallback(
    (event: ReadCodeEvent) => {
      if (handled.current) return;
      const value = event.nativeEvent.codeStringValue?.trim();
      if (!value) return;
      handled.current = true;
      onRead(value);
      onClose();
    },
    [onRead, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        {permission === 'granted' && (
          <Suspense
            fallback={
              <View style={styles.center}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            }>
            <Camera
              style={StyleSheet.absoluteFill}
              scanBarcode
              // Solo QR: aceptar cualquier simbología haría que el código de
              // barras de una caja de encomienda pasara por punto del conjunto.
              allowedBarcodeTypes={['qr']}
              onReadCode={handleRead}
              showFrame
              laserColor={colors.primary}
              frameColor="#ffffff"
              // Sin freno la cámara reporta en cada cuadro; el pestillo ya
              // protege, pero esto le baja el trabajo al teléfono.
              scanThrottleDelay={800}
            />
          </Suspense>
        )}

        {permission === 'checking' && (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}

        {permission === 'denied' && (
          <View style={[styles.center, styles.deniedBox]}>
            <Icon name="no-photography" size={44} color="#fff" />
            <CustomTextComponent
              fontSize={FONT_SIZE.lg}
              fontWeight={FONT_WEIGHT.semibold as any}
              color="#fff"
              textAlign="center">
              Sin permiso de cámara
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color="rgba(255,255,255,0.75)"
              textAlign="center">
              Puedes activarlo en los ajustes del teléfono, o cerrar esto y
              escribir el código del sticker a mano.
            </CustomTextComponent>
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openSettings()}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium as any}
                color={colors.textInverse}>
                Abrir ajustes
              </CustomTextComponent>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar el escáner">
            <Icon name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color="#fff">
            {title ?? 'Escanear código'}
          </CustomTextComponent>
        </View>

        {permission === 'granted' && (
          <View style={styles.footer} pointerEvents="none">
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color="rgba(255,255,255,0.85)"
              textAlign="center">
              {hint ?? 'Apunta al código pegado en el sitio'}
            </CustomTextComponent>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedBox: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  settingsBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeBtn: { padding: SPACING.xs },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
