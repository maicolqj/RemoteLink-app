import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../providers/context/ThemeContext';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  color?: string;
}

export default function LoadingSpinner({ fullScreen = false, color }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color ?? colors.primary;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    );
  }

  return <ActivityIndicator size="small" color={spinnerColor} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
