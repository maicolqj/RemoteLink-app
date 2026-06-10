import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ViewStyle,
  StyleProp,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

interface CustomBottomModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Apariencia
  showHandle?: boolean;
  heightPercentage?: number;       // 0.0–1.0 (default 0.5). Ignorado si maxHeight está definido.
  maxHeight?: number;              // Altura fija en px (toma precedencia sobre heightPercentage)
  backgroundColor?: string;
  overlayColor?: string;
  handleColor?: string;
  borderTopRadius?: number;

  // Espaciado interno
  paddingHorizontal?: number;
  paddingBottom?: number;

  // Comportamiento
  closeOnOverlayPress?: boolean;   // Cerrar al tocar el fondo oscuro (default true)
  avoidKeyboard?: boolean;         // Subir el sheet cuando aparece el teclado (default false)
  animationType?: 'slide' | 'fade' | 'none';
  statusBarTranslucent?: boolean;

  // Estilos extra
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

const CustomBottomModal: React.FC<CustomBottomModalProps> = ({
  isVisible,
  onClose,
  children,
  showHandle = true,
  heightPercentage = 0.5,
  maxHeight,
  backgroundColor = '#FFFFFF',
  overlayColor = 'rgba(0,0,0,0.5)',
  handleColor = '#D1D5DB',
  borderTopRadius = 24,
  paddingHorizontal = 20,
  paddingBottom = 32,
  closeOnOverlayPress = true,
  avoidKeyboard = false,
  animationType = 'slide',
  statusBarTranslucent = true,
  containerStyle,
  contentStyle,
}) => {
  const sheetHeight = maxHeight ?? SCREEN_H * heightPercentage;

  const sheet = (
    <View
      style={[
        styles.sheet,
        {
          height: sheetHeight,
          backgroundColor,
          borderTopLeftRadius: borderTopRadius,
          borderTopRightRadius: borderTopRadius,
          paddingHorizontal,
          paddingBottom,
        },
        containerStyle,
      ]}
    >
      {showHandle && (
        <View style={[styles.handle, { backgroundColor: handleColor }]} />
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      {/* Overlay: capa oscura que ocupa toda la pantalla */}
      <TouchableWithoutFeedback
        onPress={closeOnOverlayPress ? onClose : undefined}
      >
        <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
          {/* Bloquea la propagación del toque hacia el overlay */}
          <TouchableWithoutFeedback>
            {avoidKeyboard ? (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                {sheet}
              </KeyboardAvoidingView>
            ) : (
              sheet
            )}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});

export default CustomBottomModal;
