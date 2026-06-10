import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { useGlobalStyles } from '../styles/useGlobalStyles';
import { SPACING } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
    badge?: number;
  };
  transparent?: boolean;
}

function ThemeToggleButton() {
  const { colors, isDark, toggleTheme } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => rotation.setValue(0));
  }, [isDark]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={styles.themeBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Icon
          name={isDark ? 'wb-sunny' : 'dark-mode'}
          size={22}
          color={isDark ? '#FBBF24' : '#64748B'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AppHeader({ title, subtitle, showBack, onBack, rightAction, transparent }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const gs = useGlobalStyles();

  const showThemeToggle = !showBack;

  return (
    <View style={[
      styles.container,
      { backgroundColor: transparent ? 'transparent' : colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + SPACING.sm },
      transparent && styles.transparent,
    ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : colors.surface}
      />

      <View style={gs.rowBetween}>
        {/* Left side */}
        <View style={styles.side}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={styles.titleContainer}>
          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}
            numberOfLines={1}>
            {title}
          </CustomTextComponent>
          {subtitle ? (
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </CustomTextComponent>
          ) : null}
        </View>

        {/* Right side */}
        <View style={[styles.side, (showThemeToggle && rightAction) && styles.sideDouble]}>
          {showThemeToggle && <ThemeToggleButton />}
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={rightAction.icon} size={24} color={colors.textPrimary} />
              {!!rightAction.badge && rightAction.badge > 0 && (
                <View style={gs.badgeContainer}>
                  <CustomTextComponent style={gs.badgeText as any}>
                    {rightAction.badge > 9 ? '9+' : String(rightAction.badge)}
                  </CustomTextComponent>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  transparent: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideDouble: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  actionBtn: {
    padding: SPACING.xs,
    position: 'relative',
  },
  themeBtn: {
    padding: SPACING.xs,
  },
});
