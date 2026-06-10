import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

interface QRScannerOverlayProps {
  width?: number;          // Ancho del área de escaneo
  height?: number;         // Alto del área de escaneo
  direction?: 'vertical' | 'horizontal'; // Dirección del movimiento
  borderColor?: string;
  overlayColor?: string;
}

const QRScannerOverlayComponent: React.FC<QRScannerOverlayProps> = ({
  width: scanWidth = 250,
  height: scanHeight = 250,
  direction = 'vertical',
  borderColor = '#00E676',
  overlayColor = 'rgba(0, 0, 0, 0.6)',
}) => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad), // Un movimiento más suave
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim]);

  // Lógica de movimiento según la dirección
  const isVertical = direction === 'vertical';

  const transformValue = isVertical
    ? {
      translateY: scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, scanHeight - 2],
      })
    }
    : {
      translateX: scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, scanWidth - 2],
      })
    };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        {/* Parte Superior */}
        <View style={{ flex: 1, backgroundColor: overlayColor }} />

        {/* Fila Central */}
        <View style={{ flexDirection: 'row', height: scanHeight }}>
          <View style={{ flex: 1, backgroundColor: overlayColor }} />

          {/* ÁREA DE ENFOQUE */}
          <View style={[styles.spacer, { width: scanWidth, height: scanHeight }]}>
            {/* Esquinas */}
            <View style={[styles.corner, styles.topLeft, { borderColor }]} />
            <View style={[styles.corner, styles.topRight, { borderColor }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor }]} />

            {/* Línea de escaneo animada */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: borderColor,
                  width: isVertical ? '100%' : 2,
                  height: isVertical ? 2 : '100%',
                  // Forzamos el tipo como un elemento de ViewStyle['transform']
                  transform: [transformValue] as any
                }
              ]}
            />
          </View>

          <View style={{ flex: 1, backgroundColor: overlayColor }} />
        </View>

        {/* Parte Inferior */}
        <View style={{ flex: 1, backgroundColor: overlayColor }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spacer: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    width: 20,
    height: 20,
    position: 'absolute',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default QRScannerOverlayComponent;