import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useMarketplaceStore } from '../../store/marketplace.store';
import type { MarketplaceStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<MarketplaceStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { products, addToCart, cart } = useMarketplaceStore();
  const product = products.find(p => p.id === route.params.productId);

  const cartItem = cart.find(i => i.product.id === product?.id);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (!product) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Producto" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
            Producto no encontrado
          </CustomTextComponent>
        </View>
      </View>
    );
  }

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Detalle"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'shopping-cart', onPress: () => navigation.navigate('Cart' as never), badge: cartCount }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.imageArea, { backgroundColor: colors.primarySurface }]}>
          <Icon name="inventory-2" size={80} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <View style={gs.rowBetween}>
            <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} style={styles.name}>
              {product.name}
            </CustomTextComponent>
            <StatusChip
              label={product.stock > 0 ? 'Disponible' : 'Sin stock'}
              variant={product.stock > 0 ? 'success' : 'error'}
            />
          </View>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
            {product.category}
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.xxxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.primary}>
            ${product.price.toLocaleString('es-CO')}
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
            {product.description}
          </CustomTextComponent>

          <View style={gs.divider} />

          <View style={styles.stockRow}>
            <Icon name="inventory" size={16} color={colors.textSecondary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {product.stock} unidades disponibles
            </CustomTextComponent>
          </View>

          {cartItem && (
            <View style={[styles.inCartBanner, { backgroundColor: colors.successLight }]}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.success}>
                {cartItem.quantity} en tu carrito
              </CustomTextComponent>
            </View>
          )}

          <Button
            label={cartItem ? 'Agregar más' : 'Agregar al carrito'}
            onPress={() => addToCart(product)}
            icon="add-shopping-cart"
            fullWidth
            size="lg"
            disabled={product.stock === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: SPACING.xxl },
  imageArea: { height: 220, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.md, gap: SPACING.sm },
  name: { flex: 1, marginRight: SPACING.sm },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inCartBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.sm, borderRadius: SPACING.xs },
});
