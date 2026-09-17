import React from 'react';
import { Modal, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from './CustomTextComponent';
import { SPACING } from '../constants/spacing';
import { FONT_SIZE } from '../constants/typography';

interface ImageViewerModalProps {
  uri: string | null;
  caption?: string | null;
  onClose: () => void;
}

/**
 * La foto en grande.
 *
 * En una miniatura de 48 px no se distingue una mascota de otra ni se lee una
 * placa: el residente necesita ver la foto completa para reconocer lo que la
 * ficha dice que es suyo. Se cierra tocando en cualquier parte —en el celular
 * nadie busca la X— y la imagen va en `contain` para no recortar justo la parte
 * que se quería mirar.
 */
export default function ImageViewerModal({ uri, caption, onClose }: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.close, { top: insets.top + SPACING.sm }]}
          onPress={onClose}>
          <Icon name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {!!uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}

        {!!caption && (
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color="#FFFFFF"
            textAlign="center"
            style={styles.caption}>
            {caption}
          </CustomTextComponent>
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width,
    height: height * 0.75,
  },
  close: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  caption: {
    position: 'absolute',
    bottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
});
