import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';

// ============================================================================
// TYPES
// ============================================================================

type IconType = 'ionicon' | 'material';

interface IconConfig {
  name: string;
  type: IconType;
  size?: number;
  color?: string;
}

interface CustomButtonProps {
  // Content
  text?: string;
  children?: ReactNode;
  iconLeft?: IconConfig;
  iconRight?: IconConfig;

  // Behavior
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;

  // Styles (Soportan formato array automáticamente con StyleProp)
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconLeftStyle?: StyleProp<TextStyle>;
  iconRightStyle?: StyleProp<TextStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;

  // Loader
  loaderColor?: string;
  loaderSize?: 'small' | 'large';

  // Interaction
  activeOpacity?: number;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CustomButtonComponent: React.FC<CustomButtonProps> = ({
  text,
  children,
  iconLeft,
  iconRight,
  onPress,
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  iconLeftStyle,
  iconRightStyle,
  contentContainerStyle,
  loaderColor = '#000',
  loaderSize = 'small',
  activeOpacity = 0.7,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  
  // Decisión lógica de estado: si está cargando, también se comporta como deshabilitado
  const isDisabled = disabled || isLoading;

  const handlePress = () => {
    if (!isDisabled) {
      onPress();
    }
  };

  const renderIcon = (
    icon: IconConfig | undefined,
    position: 'left' | 'right',
    customStyle?: StyleProp<TextStyle>
  ) => {
    if (!icon) return null;

    const IconComponent = icon.type === 'ionicon' ? IonIcon : MaterialIcon;
    const defaultIconStyle = position === 'left' ? styles.mr8 : styles.ml8;

    return (
      <IconComponent
        name={icon.name}
        size={icon.size || 20}
        color={icon.color || '#000'}
        style={[defaultIconStyle, customStyle]}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={activeOpacity}
      disabled={isDisabled}
      // Combinamos estilos base, el prop style (que ya acepta arrays) y el estado disabled
      style={[
        styles.base,
        style,
        isDisabled && styles.disabled, 
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || text}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator size={loaderSize} color={loaderColor} />
      ) : (
        <View style={[styles.content, contentContainerStyle]}>
          {children ? (
            children
          ) : (
            <>
              {renderIcon(iconLeft, 'left', iconLeftStyle)}
              {text && (
                <CustomTextComponent style={textStyle}>
                  {text}
                </CustomTextComponent>
              )}
              {renderIcon(iconRight, 'right', iconRightStyle)}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // Recomendado por Apple/Google para targets táctiles
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  mr8: {
    marginRight: 8,
  },
  ml8: {
    marginLeft: 8,
  },
});

export default CustomButtonComponent;