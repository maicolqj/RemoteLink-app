import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { FONT_WEIGHT } from '../constants/typography';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56, xl: 80 };
const FONT_MAP: Record<AvatarSize, number> = { sm: 12, md: 15, lg: 20, xl: 28 };

interface AvatarProps {
  size?: AvatarSize;
  name?: string;
  uri?: string;
  color?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({ size = 'md', name = '', uri, color }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const bg = color ?? colors.primary;

  const containerStyle = [
    styles.container,
    { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor: bg },
  ];

  if (uri) {
    return <Image source={{ uri }} style={[containerStyle as any, { backgroundColor: colors.border }]} />;
  }

  return (
    <View style={containerStyle}>
      <CustomTextComponent fontSize={fontSize} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textInverse}>
        {getInitials(name)}
      </CustomTextComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
