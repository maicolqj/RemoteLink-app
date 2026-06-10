import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  Camera, useCameraDevice, useCameraPermission, useCodeScanner,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';

import QRScannerOverlayComponent from './QRScannerOverlayComponent';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractComplexId(raw: string): string | null {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj?.complexId === 'string') return obj.complexId;
  } catch {}
  const match = UUID_RE.exec(raw);
  return match ? match[0] : null;
}

interface Props {
  visible: boolean;
  onScan: (complexId: string) => void;
  onClose: () => void;
}

export function QRScannerModal({ visible, onScan, onClose }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const scannedRef = useRef(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setScanError(null);
      if (!hasPermission) requestPermission();
    }
  }, [visible, hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: useCallback((codes) => {
      if (!visible || scannedRef.current) return;
      const raw = codes[0]?.value;
      if (!raw) return;

      const complexId = extractComplexId(raw);
      if (!complexId) {
        scannedRef.current = true;
        setScanError('QR inválido. No contiene un ID de complejo.');
        return;
      }

      scannedRef.current = true;
      onScan(complexId);
    }, [visible, onScan]),
  });

  const handleRetry = () => {
    scannedRef.current = false;
    setScanError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={st.root}>
        {device && hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible && !scanError}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={st.noCamera}>
            <Icon name="no-photography" size={48} color="rgba(255,255,255,0.25)" />
            <Text style={st.noCameraTxt}>Cámara no disponible</Text>
          </View>
        )}

        <QRScannerOverlayComponent
          borderColor="#4DA6FF"
          overlayColor="rgba(0,0,0,0.65)"
        />

        {/* Top bar */}
        <View style={st.topBar}>
          <TouchableOpacity style={st.circleBtn} onPress={onClose} activeOpacity={0.75}>
            <Icon name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={st.title}>Escanear QR de complejo</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom hint */}
        <View style={st.bottomBox}>
          {!scanError ? (
            <View style={st.hintRow}>
              <ActivityIndicator color="#4DA6FF" size="small" />
              <Text style={st.hint}>Apunta al código QR del complejo</Text>
            </View>
          ) : (
            <>
              <View style={st.errorRow}>
                <Icon name="error-outline" size={16} color="#FF453A" />
                <Text style={st.errorTxt}>{scanError}</Text>
              </View>
              <TouchableOpacity style={st.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
                <Icon name="refresh" size={15} color="#4DA6FF" />
                <Text style={st.retryTxt}>Reintentar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  noCamera: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noCameraTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  topBar: {
    position: 'absolute', top: 52, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },

  bottomBox: {
    position: 'absolute', bottom: 64, left: 24, right: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', gap: 10,
  },
  hintRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint:      { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorTxt:  { color: '#FF453A', fontSize: 13, textAlign: 'center', flex: 1 },
  retryBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#4DA6FF',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  retryTxt: { color: '#4DA6FF', fontSize: 13 },
});
