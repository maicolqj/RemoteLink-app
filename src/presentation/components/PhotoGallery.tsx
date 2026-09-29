import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import CustomTextComponent from './CustomTextComponent';
import ImageViewerModal from './ImageViewerModal';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE } from '../constants/typography';

interface PhotoGalleryProps {
  urls: string[];
  /** Alto sobre ancho. 0.75 = 4:3. */
  ratio?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Carrusel de fotos a todo el ancho de la pantalla.
 *
 * Las fotos se ven completas —sin recorte— y el sobrante queda como franja del
 * fondo. Tocar una la abre en grande. Con más de una, un contador avisa que hay
 * más: a todo el ancho no se asoma la siguiente.
 */
export default function PhotoGallery({ urls, ratio = 0.75, style }: PhotoGalleryProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState<string | null>(null);

  if (urls.length === 0) return null;

  const size = { width, height: Math.round(width * ratio) };

  return (
    <View style={style}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={{ height: size.height }}>
        {urls.map(url => (
          <TouchableOpacity key={url} activeOpacity={0.9} onPress={() => setZoomed(url)}>
            <Image
              source={{ uri: url }}
              style={[size, { backgroundColor: colors.surface }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {urls.length > 1 && (
        <View style={styles.counter}>
          <CustomTextComponent fontSize={FONT_SIZE.xs} color="#FFFFFF">
            {index + 1}/{urls.length}
          </CustomTextComponent>
        </View>
      )}

      <ImageViewerModal uri={zoomed} onClose={() => setZoomed(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
});
