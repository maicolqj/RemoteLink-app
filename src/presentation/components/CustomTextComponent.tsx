import React, { ReactNode, useMemo } from 'react';
import {
    Text,
    TextStyle,
    TextProps,
    StyleSheet,
    Platform,
    PixelRatio,
    View,
    ViewStyle,
    StyleProp // 1. 🔧 Importamos StyleProp
} from 'react-native';

// ==================== TYPES ====================
type FontFamily = 'titleBold' | 'titleMedium' | 'titleRegular' | 'textRegular' | 'textBold' | 'textMedium' | string;
type FontWeight = 
    | 'normal' 
    | 'bold' 
    | '100' 
    | '200' 
    | '300' 
    | '400' 
    | '500' 
    | '600' 
    | '700' 
    | '800' 
    | '900'
    | 100
    | 200
    | 300
    | 400
    | 500
    | 600
    | 700
    | 800
    | 900
    | 'ultralight'
    | 'thin'
    | 'light'
    | 'medium'
    | 'regular'
    | 'semibold'
    | 'condensedBold'
    | 'condensed'
    | 'heavy'
    | 'black';
type EllipsizeMode = 'clip' | 'head' | 'middle' | 'tail';
type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';
type TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase';
type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body1' | 'body2' | 'caption' | 'button' | 'overline';

export interface TextTheme {
    fontSize: number;
    lineHeight?: number;
    letterSpacing?: number;
    fontFamily?: FontFamily;
    fontWeight?: FontWeight;
}

// ==================== DEFAULT THEME ====================
const defaultTextTheme: Record<TextVariant, TextTheme> = {
    h1: { fontSize: 32, lineHeight: 40, letterSpacing: 0.25, fontFamily: 'titleBold', fontWeight: '700' },
    h2: { fontSize: 24, lineHeight: 32, letterSpacing: 0, fontFamily: 'titleBold', fontWeight: '700' },
    h3: { fontSize: 20, lineHeight: 28, letterSpacing: 0.15, fontFamily: 'titleMedium', fontWeight: '600' },
    h4: { fontSize: 18, lineHeight: 26, letterSpacing: 0.15, fontFamily: 'titleMedium', fontWeight: '500' },
    h5: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontFamily: 'titleRegular', fontWeight: '500' },
    body1: { fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontFamily: 'textRegular', fontWeight: '400' },
    body2: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontFamily: 'textRegular', fontWeight: '400' },
    caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontFamily: 'textRegular', fontWeight: '400' },
    button: { fontSize: 14, lineHeight: 20, letterSpacing: 1.25, fontFamily: 'textMedium', fontWeight: '500' },
    overline: { fontSize: 10, lineHeight: 16, letterSpacing: 1.5, fontFamily: 'textMedium', fontWeight: '500' },
};

// ==================== COMPONENT PROPS ====================
interface CustomTextComponentProps extends Omit<TextProps, 'style'> {
    children: ReactNode;
    fontFamily?: FontFamily;
    fontWeight?: FontWeight;
    color?: string;
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlign?: TextAlign;
    textTransform?: TextTransform;
    ellipsizeMode?: EllipsizeMode;
    variant?: TextVariant;
    style?: StyleProp<TextStyle>; // 2. 🔧 Cambiado a StyleProp para aceptar arreglos y condicionales complejos
    numberOfLines?: number;
    underline?: boolean;
    strikethrough?: boolean;
    selectable?: boolean;
    italic?: boolean;
    adjustsFontSizeToFit?: boolean;
    minimumFontScale?: number;
    maxFontSizeMultiplier?: number;
    onPress?: () => void;
    onLongPress?: () => void;
    theme?: Record<TextVariant, TextTheme>;
    responsive?: boolean;
    scale?: number;
    testID?: string;
    allowFontScaling?: boolean;
    useViewWrapper?: boolean;
    minHeight?: number;
    debug?: boolean;
}

// ==================== MAIN COMPONENT ====================
const CustomTextComponent: React.FC<CustomTextComponentProps> = ({
    children,
    style,
    fontFamily,
    fontWeight,
    color,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign,
    textTransform,
    ellipsizeMode,
    variant = 'body1',
    numberOfLines,
    underline = false,
    strikethrough = false,
    selectable = false,
    italic = false,
    adjustsFontSizeToFit = false,
    minimumFontScale = 0.7,
    maxFontSizeMultiplier = 1.2,
    onPress,
    onLongPress,
    theme = defaultTextTheme,
    responsive = true,
    scale = 1,
    testID,
    allowFontScaling = false,
    useViewWrapper = false,
    minHeight,
    debug = false,
    ...restProps
}) => {
    // ==================== RESPONSIVE SIZING ====================
    const getResponsiveSize = (size: number): number => {
        if (!responsive) return size * scale;
        const fontScale = PixelRatio.getFontScale();
        const maxScale = Platform.OS === 'ios' ? 1.5 : 1.2;
        return size * scale * Math.min(fontScale, maxScale);
    };

    // ==================== CALCULATE LINE HEIGHT ====================
    const calculateLineHeight = (
        baseFontSize: number,
        providedLineHeight?: number,
        weight?: FontWeight
    ): number => {
        if (providedLineHeight !== undefined) return providedLineHeight;

        let ratio = 1.5;
        if (baseFontSize < 14) ratio = 1.4;
        else if (baseFontSize >= 14 && baseFontSize < 24) ratio = 1.5;
        else if (baseFontSize >= 24 && baseFontSize < 36) ratio = 1.4;
        else ratio = 1.35;

        const heavyWeights = ['700', '800', '900', 'bold', 'heavy', 'black', 700, 800, 900];
        if (weight && heavyWeights.includes(weight as any)) {
            ratio += 0.1;
        }
        return Math.ceil(baseFontSize * ratio);
    };

    // ==================== HANDLE TEXT SHADOW ====================
    // 3. 🔧 Tipamos el parámetro como TextStyle en lugar de any
    const extractTextShadow = (styles: TextStyle) => {
        const {
            textShadowColor,
            textShadowOffset,
            textShadowRadius,
            ...otherStyles
        } = styles;

        return {
            textShadow: textShadowColor ? {
                textShadowColor,
                textShadowOffset: textShadowOffset || { width: 0, height: 0 },
                textShadowRadius: textShadowRadius || 0,
            } : null,
            otherStyles
        };
    };

    // ==================== MEMOIZED STYLES ====================
    const { textStyles, containerStyles, needsWrapper } = useMemo(() => {
        const variantStyle = theme[variant] || defaultTextTheme[variant];

        // 4. 🔧 StyleSheet.flatten ya sabe qué hacer con StyleProp<TextStyle>
        const userStyle = style ? StyleSheet.flatten(style) : {};
        const { textShadow, otherStyles } = extractTextShadow(userStyle);

        const finalFontSize = userStyle.fontSize ?? fontSize ?? variantStyle.fontSize;
        const finalFontWeight = userStyle.fontWeight ?? fontWeight ?? variantStyle.fontWeight;
        const finalFontFamily = userStyle.fontFamily ?? fontFamily ?? variantStyle.fontFamily;
        const finalColor = userStyle.color ?? color ?? '#000';
        const finalTextAlign = userStyle.textAlign ?? textAlign;
        const finalTextTransform = userStyle.textTransform ?? textTransform;
        const finalLetterSpacing = userStyle.letterSpacing ?? letterSpacing ?? variantStyle.letterSpacing ?? 0;

        const finalLineHeight = calculateLineHeight(
            finalFontSize,
            userStyle.lineHeight ?? lineHeight ?? variantStyle.lineHeight,
            finalFontWeight
        );

        const decorations: string[] = [];
        if (underline) decorations.push('underline');
        if (strikethrough) decorations.push('line-through');
        const textDecorationLine = (decorations.length > 0
            ? decorations.join(' ')
            : 'none') as TextStyle['textDecorationLine'];

        const safePadding = finalFontSize > 40 ? finalFontSize * 0.15 : 0;

        const baseStyle: TextStyle = {
            fontSize: finalFontSize,
            lineHeight: finalLineHeight,
            letterSpacing: finalLetterSpacing,
            fontFamily: finalFontFamily,
            fontWeight: finalFontWeight,
            color: finalColor,
            textDecorationLine,
            ...(finalTextAlign && { textAlign: finalTextAlign }),
            ...(finalTextTransform && { textTransform: finalTextTransform }),
            ...(italic && { fontStyle: 'italic' }),
            ...(Platform.OS === 'android' && {
                includeFontPadding: false,
                textAlignVertical: 'center',
            }),
        };

        const { 
            fontSize: _fs, 
            lineHeight: _lh, 
            fontWeight: _fw, 
            fontFamily: _ff,
            color: _c,
            textAlign: _ta,
            textTransform: _tt,
            letterSpacing: _ls,
            ...remainingUserStyles 
        } = otherStyles;

        const finalTextStyle = StyleSheet.flatten([
            baseStyle,
            remainingUserStyles,
            textShadow,
            safePadding > 0 && { paddingVertical: safePadding },
        ]);

        const shouldUseWrapper = useViewWrapper || finalFontSize > 40 || !!textShadow;

        const containerStyle: ViewStyle | null = shouldUseWrapper
            ? {
                minHeight: minHeight || finalLineHeight + safePadding * 2,
                justifyContent: 'center',
                alignItems:
                    finalTextAlign === 'center'
                        ? 'center'
                        : finalTextAlign === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                overflow: 'visible',
                ...(safePadding > 0 && { paddingVertical: safePadding / 2 }),
                ...(debug && {
                    backgroundColor: 'rgba(255,0,0,0.1)',
                    borderWidth: 1,
                    borderColor: 'red',
                }),
            }
            : null;

        return {
            textStyles: finalTextStyle,
            containerStyles: containerStyle,
            needsWrapper: shouldUseWrapper,
        };
    }, [
        variant, theme, color, fontFamily, fontWeight, fontSize, lineHeight,
        letterSpacing, textAlign, textTransform, underline, strikethrough,
        italic, style, responsive, scale, useViewWrapper, minHeight, debug,
    ]);

    // ==================== RENDER ====================
    const textElement = (
        <Text
            style={textStyles}
            ellipsizeMode={ellipsizeMode}
            numberOfLines={numberOfLines}
            selectable={selectable}
            adjustsFontSizeToFit={adjustsFontSizeToFit}
            minimumFontScale={minimumFontScale}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            allowFontScaling={allowFontScaling}
            onPress={onPress}
            onLongPress={onLongPress}
            testID={testID}
            accessible={true}
            accessibilityRole="text"
            {...restProps}
        >
            {children}
        </Text>
    );

    if (needsWrapper && containerStyles) {
        return <View style={containerStyles}>{textElement}</View>;
    }

    return textElement;
};

// ==================== UTILITY STYLES ====================
export const TextStyles = StyleSheet.create({
    bold: { fontWeight: '700' },
    semiBold: { fontWeight: '600' },
    medium: { fontWeight: '500' },
    regular: { fontWeight: '400' },
    light: { fontWeight: '300' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },
    left: { textAlign: 'left' },
    justify: { textAlign: 'justify' },
    italic: { fontStyle: 'italic' },
    underline: { textDecorationLine: 'underline' },
    lineThrough: { textDecorationLine: 'line-through' },
    uppercase: { textTransform: 'uppercase' },
    lowercase: { textTransform: 'lowercase' },
    capitalize: { textTransform: 'capitalize' },
    shadowSm: { textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    shadowMd: { textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    shadowLg: { textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8 },
});

export default CustomTextComponent;
export { CustomTextComponent };