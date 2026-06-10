import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
const INPUT_HEIGHT = SCREEN_HEIGHT * 0.055;
const ICON_SIZE = SCREEN_HEIGHT * 0.024;
const FONT_SIZE = SCREEN_HEIGHT * 0.015;
const PADDING_HORIZONTAL = SCREEN_WIDTH * 0.001;
const BORDER_RADIUS = SCREEN_WIDTH * 0.03;

type KeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad';
type AutoCapitalize = 'words' | 'none' | 'sentences' | 'characters';
type ButtonMode = 'always-enabled' | 'enabled-with-valid-input' | 'always-disabled';
type ValidationType = 'default' | 'email' | 'numeric' | 'phone' | 'none';
type InputVariant = 'outlined' | 'filled' | 'underlined' | 'transparent';

interface IconProps {
  name: string;
  color?: string;
  size?: number;
  style?: ViewStyle;
  isLoadingData?: boolean;
}

interface RightIconProps extends IconProps {
  onPress: () => void;
  buttonMode?: ButtonMode;
  activeOpacity?: number;
}

interface BorderConfig {
  width?: number;
  color?: string;
  focusedColor?: string;
  errorColor?: string;
  radius?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface CustomInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  nameInput?: string;
  autoFocus?: boolean;
  autoCorrect?: boolean;
  multiline?: boolean;
  leftIcon?: IconProps;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardType;
  autoCapitalize?: AutoCapitalize;
  rightIcon?: RightIconProps;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorContainerStyle?: StyleProp<ViewStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  leftIconContainerStyle?: StyleProp<ViewStyle>;
  rightIconContainerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
  maxLength?: number;
  validationType?: ValidationType;
  error?: string;
  touched?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
  marginBottom?: number;
  numberOfLines?: number;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  showErrorIcon?: boolean;
  disableErrorAnimation?: boolean;
  placeholderTextColor?: string;
  variant?: InputVariant;
  borderConfig?: BorderConfig;
  backgroundColor?: string;
  focusedBackgroundColor?: string;
  disableBorderAnimation?: boolean;
  hideShadow?: boolean;
  underlineHeight?: number;
  cursorColor?: string;
  selectionColor?: string;
}

const CustomInputComponent: React.FC<CustomInputProps> = ({
  value,
  onChangeText,
  placeholder,
  leftIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  rightIcon,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  labelStyle,
  errorContainerStyle,
  errorTextStyle,
  leftIconContainerStyle,
  rightIconContainerStyle,
  nameInput,
  autoFocus = false,
  autoCorrect = false,
  maxLength,
  multiline = false,
  editable = true,
  validationType = 'default',
  error,
  touched,
  onBlur,
  onFocus,
  testID,
  marginBottom,
  numberOfLines = 4,
  returnKeyType,
  onSubmitEditing,
  showErrorIcon = true,
  disableErrorAnimation = false,
  placeholderTextColor,
  variant = 'outlined',
  borderConfig,
  backgroundColor,
  focusedBackgroundColor,
  disableBorderAnimation = true,
  hideShadow = false,
  underlineHeight = 2,
  cursorColor,
  selectionColor,
}) => {
  const { colors } = useTheme();

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const errorHeight = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const defaultBorderConfig: BorderConfig = {
    width: variant === 'outlined' ? 1 : 0,
    color: borderConfig?.color || colors.border,
    focusedColor: borderConfig?.focusedColor || colors.primary,
    errorColor: borderConfig?.errorColor || colors.error,
    radius: borderConfig?.radius ?? 10,
    style: borderConfig?.style || 'solid',
  };

  const finalBorderConfig = { ...defaultBorderConfig, ...borderConfig };

  const isValidInput = useCallback((text: string): boolean => {
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    switch (validationType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedText);
      case 'numeric':
      case 'phone':
        return /^[0-9+\-() ]+$/.test(trimmedText);
      case 'none':
        return true;
      default:
        return trimmedText.length > 0;
    }
  }, [validationType]);

  useEffect(() => {
    if (rightIcon?.buttonMode === 'enabled-with-valid-input') {
      setIsButtonDisabled(!isValidInput(value));
    } else if (rightIcon?.buttonMode === 'always-disabled') {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [value, rightIcon?.buttonMode, isValidInput]);

  useEffect(() => {
    if (!disableErrorAnimation) {
      if (error && touched) {
        Animated.parallel([
          Animated.spring(errorHeight, { toValue: 1, useNativeDriver: false, tension: 100, friction: 8 }),
          Animated.timing(errorOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(errorHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(errorOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
        ]).start();
      }
    }
  }, [error, touched, disableErrorAnimation]);

  useEffect(() => {
    if (!disableBorderAnimation) {
      Animated.timing(borderColorAnim, {
        toValue: error && touched ? 2 : isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    if (focusedBackgroundColor) {
      Animated.timing(backgroundColorAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, error, touched, disableBorderAnimation]);

  const handleFocus = () => { setIsFocused(true); onFocus?.(); };
  const handleBlur = () => { setIsFocused(false); onBlur?.(); };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    const iconColor = leftIcon.color || colors.primary;
    const iconSize = leftIcon.size || ICON_SIZE;
    return (
      <View style={[styles.leftIconContainer, leftIconContainerStyle, leftIcon.style]}>
        {leftIcon.isLoadingData ? (
          <ActivityIndicator size={iconSize} color={iconColor} />
        ) : (
          <Icon name={leftIcon.name} size={iconSize} color={iconColor} />
        )}
      </View>
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    const iconColor = rightIcon.color || colors.primary;
    const iconSize = rightIcon.size || ICON_SIZE;
    return (
      <TouchableOpacity
        onPress={rightIcon.onPress}
        style={[styles.rightIconContainer, rightIconContainerStyle, rightIcon.style, isButtonDisabled && styles.disabledButton]}
        disabled={isButtonDisabled || rightIcon.isLoadingData}
        activeOpacity={rightIcon.activeOpacity || 0.7}
        testID={`${testID}-right-icon`}
      >
        {rightIcon.isLoadingData ? (
          <ActivityIndicator size={iconSize} color={colors.primary} />
        ) : (
          <Icon name={rightIcon.name} size={iconSize} color={iconColor} style={isButtonDisabled && styles.disabledIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderError = () => {
    if (!error || !touched) return null;
    if (disableErrorAnimation) {
      return (
        <View style={[styles.errorContainer, errorContainerStyle]}>
          {showErrorIcon && <Icon name="warning" size={ICON_SIZE * 0.75} color={colors.error} />}
          <CustomTextComponent style={[styles.errorText, { color: colors.error }, errorTextStyle as TextStyle]}>
            {error}
          </CustomTextComponent>
        </View>
      );
    }
    const animatedHeight = errorHeight.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_HEIGHT * 0.028] });
    return (
      <Animated.View style={[styles.errorContainer, errorContainerStyle, { height: animatedHeight, opacity: errorOpacity, overflow: 'hidden' }]}>
        {showErrorIcon && <Icon name="warning" size={ICON_SIZE * 0.75} color={colors.error} />}
        <CustomTextComponent style={[styles.errorText, { color: colors.error }, errorTextStyle as TextStyle]}>
          {error}
        </CustomTextComponent>
      </Animated.View>
    );
  };

  const borderColor = disableBorderAnimation
    ? (error && touched ? finalBorderConfig.errorColor : isFocused ? finalBorderConfig.focusedColor : finalBorderConfig.color)
    : borderColorAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [finalBorderConfig.color!, finalBorderConfig.focusedColor!, finalBorderConfig.errorColor!],
      });

  const getBackgroundColor = () => {
    if (!focusedBackgroundColor) return backgroundColor || colors.surface;
    return backgroundColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [backgroundColor || colors.surface, focusedBackgroundColor],
    });
  };

  const multilineHeight = multiline ? INPUT_HEIGHT * numberOfLines / 2 : INPUT_HEIGHT;

  const getVariantStyles = (): any => {
    const baseStyles: any = { borderRadius: finalBorderConfig.radius };
    if (!focusedBackgroundColor) baseStyles.backgroundColor = backgroundColor || colors.surface;
    switch (variant) {
      case 'outlined':
        return { ...baseStyles, borderWidth: finalBorderConfig.width, borderColor: borderColor };
      case 'filled':
        return { ...baseStyles, borderWidth: 0, backgroundColor: backgroundColor || colors.border };
      case 'underlined':
        return { ...baseStyles, borderRadius: 0, borderWidth: 0, borderBottomWidth: underlineHeight, borderBottomColor: borderColor, backgroundColor: 'transparent', paddingHorizontal: PADDING_HORIZONTAL * 0.5 };
      case 'transparent':
        return { ...baseStyles, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: PADDING_HORIZONTAL * 0.5 };
      default:
        return baseStyles;
    }
  };

  const getShadowStyles = (): ViewStyle => {
    if (hideShadow || variant === 'transparent') return {};
    return Platform.select({
      ios: { shadowColor: colors.border, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: variant === 'outlined' || variant === 'filled' ? 2 : 0 },
    }) || {};
  };

  return (
    <View style={[styles.container, { marginBottom: marginBottom !== undefined ? marginBottom : SCREEN_HEIGHT * 0.008 }, containerStyle]}>
      {nameInput && (
        <CustomTextComponent style={[styles.nameInput, { color: colors.textSecondary }, labelStyle as TextStyle]}>
          {nameInput.toUpperCase()}
        </CustomTextComponent>
      )}

      <Animated.View style={[
        styles.inputWrapper,
        getVariantStyles(),
        getShadowStyles(),
        focusedBackgroundColor && { backgroundColor: getBackgroundColor() },
        inputWrapperStyle,
        multiline && { height: multilineHeight, alignItems: 'flex-start' },
      ]}>
        {renderLeftIcon()}

        <TextInput
          testID={testID}
          style={[styles.input, { color: colors.textPrimary, backgroundColor: 'transparent' }, inputStyle, multiline && styles.multilineInput, !editable && styles.disabledInput]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          value={value}
          autoFocus={autoFocus}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          autoCorrect={autoCorrect}
          onChangeText={onChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          underlineColorAndroid="transparent"
          cursorColor={cursorColor || colors.primary}
          selectionColor={selectionColor || colors.primary + '4D'}
        />

        {renderRightIcon()}
      </Animated.View>

      {renderError()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_HEIGHT,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE,
    paddingVertical: 0,
    paddingHorizontal: SPACING_INNER,
    height: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  multilineInput: {
    paddingTop: SCREEN_HEIGHT * 0.012,
    paddingBottom: SCREEN_HEIGHT * 0.012,
    textAlignVertical: 'top',
  },
  disabledInput: {
    opacity: 0.6,
  },
  leftIconContainer: {
    marginRight: SCREEN_WIDTH * 0.025,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.02,
  },
  rightIconContainer: {
    marginLeft: SCREEN_WIDTH * 0.025,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    height: '80%',
  },
  nameInput: {
    fontSize: FONT_SIZE * 0.9,
    marginBottom: SCREEN_HEIGHT * 0.006,
    paddingLeft: SCREEN_WIDTH * 0.01,
  },
  disabledButton: {
    opacity: 0.4,
  },
  disabledIcon: {
    opacity: 0.4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: SCREEN_HEIGHT * 0.005,
    paddingHorizontal: SCREEN_WIDTH * 0.015,
  },
  errorText: {
    fontSize: FONT_SIZE * 0.8,
    marginLeft: SCREEN_WIDTH * 0.012,
    flex: 1,
  },
});

const SPACING_INNER = SCREEN_WIDTH * 0.03;

export default React.memo(CustomInputComponent);
