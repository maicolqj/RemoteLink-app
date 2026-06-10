import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useMarketplaceStore, type Product } from '../../store/marketplace.store';
import type { MarketplaceStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type MarketNavProp = NativeStackNavigationProp<MarketplaceStackParamList, 'Marketplace'>;

function ProductCard({ product, onPress, onAddToCart }: { product: Product; onPress: () => void; onAddToCart: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  return (
    <TouchableOpacity style={[styles.productCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.productImage, { backgroundColor: colors.primarySurface }]}>
        <Icon name="inventory-2" size={36} color={colors.primary} />
      </View>
      <View style={styles.productInfo}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} numberOfLines={2} style={{ marginBottom: 2 }}>
          {product.name}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={{ marginBottom: SPACING.sm }}>
          {product.category}
        </CustomTextComponent>
        <View style={gs.rowBetween}>
          <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.bold as any} color={colors.primary}>
            ${product.price.toLocaleString('es-CO')}
          </CustomTextComponent>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddToCart}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="add-shopping-cart" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const navigation = useNavigation<MarketNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { products, cart, addToCart } = useMarketplaceStore();
  const [search, setSearch] = useState('');

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filtered = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Marketplace"
        rightAction={{ icon: 'shopping-cart', onPress: () => navigation.navigate('Cart'), badge: cartCount }}
      />

      <View style={styles.searchContainer}>
        <CustomInputComponent
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar productos..."
          leftIcon={{ name: 'search', color: colors.textTertiary }}
          rightIcon={search.length > 0 ? { name: 'close', color: colors.textTertiary, onPress: () => setSearch('') } : undefined}
          variant="outlined"
          marginBottom={0}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onAddToCart={() => addToCart(item)}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? gs.flex1 : styles.list}
        ListEmptyComponent={
          <EmptyState icon="store" title="Sin productos" description="El marketplace estará disponible pronto." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  row: { gap: SPACING.sm, marginBottom: SPACING.sm },
  productCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: { height: 100, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: SPACING.sm },
  addBtn: { padding: 4 },
});
