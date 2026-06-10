import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useMarketplaceStore, type CartItem } from '../../store/marketplace.store';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

function CartItemRow({ item, onIncrease, onDecrease, onRemove }: { item: CartItem; onIncrease: () => void; onDecrease: () => void; onRemove: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  return (
    <View style={[styles.itemRow, { backgroundColor: colors.surface }]}>
      <View style={[styles.itemImage, { backgroundColor: colors.primarySurface }]}>
        <Icon name="inventory-2" size={24} color={colors.primary} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={2} style={{ marginBottom: 4 }}>
          {item.product.name}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.primary}>
          ${item.product.price.toLocaleString('es-CO')}
        </CustomTextComponent>
      </View>
      <View style={styles.qtyControls}>
        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.primarySurface }]} onPress={onDecrease}>
          <Icon name="remove" size={18} color={colors.primary} />
        </TouchableOpacity>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} textAlign="center" style={styles.qty}>
          {String(item.quantity)}
        </CustomTextComponent>
        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.primarySurface }]} onPress={onIncrease}>
          <Icon name="add" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="delete-outline" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { cart, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart } = useMarketplaceStore();

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Mi carrito"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={cart.length > 0 ? { icon: 'delete-sweep', onPress: clearCart } : undefined}
      />

      <FlatList
        data={cart}
        keyExtractor={item => item.product.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrease={() => addToCart(item.product)}
            onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
            onRemove={() => removeFromCart(item.product.id)}
          />
        )}
        contentContainerStyle={cart.length === 0 ? gs.flex1 : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="Carrito vacío"
            description="Agrega productos desde el marketplace."
            actionLabel="Ver productos"
            onAction={() => navigation.goBack()}
          />
        }
        ItemSeparatorComponent={() => <View style={[gs.divider, { marginVertical: 0 }]} />}
        ListFooterComponent={
          cart.length > 0 ? (
            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={gs.rowBetween}>
                <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
                  Total
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.primary}>
                  ${cartTotal.toLocaleString('es-CO')}
                </CustomTextComponent>
              </View>
              <Button label="Confirmar pedido" onPress={() => {}} fullWidth size="lg" icon="check" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: SPACING.xxl },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  itemImage: { width: 52, height: 52, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20 },
  footer: { padding: SPACING.md, gap: SPACING.md, borderTopWidth: 1 },
});
