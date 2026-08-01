import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewProps } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AppHeader from '../../components/AppHeader';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { toEmbedUrl } from '../../constants/legal';
import type { RootStackParamList } from '../../navigation/types/NavigationTypes';

type LegalRoute = RouteProp<RootStackParamList, 'Legal'>;

// Host propio; cualquier navegación fuera de él sale al navegador del sistema en
// vez de quedar atrapada dentro del WebView.
const ALLOWED_HOST = 'app.alternaqj.com';

// react-native-webview@14 declara `class WebView<P = undefined>`, y
// `WebViewProps & undefined` colapsa a `never`, así que en JSX ninguna prop
// llega a tipar. El componente real es un forwardRef sobre WebViewProps.
const LegalWebView = WebView as unknown as React.ComponentType<WebViewProps>;

const isInternalUrl = (url: string) => {
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === 'https:' || protocol === 'http:') && hostname === ALLOWED_HOST;
  } catch {
    return false;
  }
};

export default function LegalScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { url, title } = useRoute<LegalRoute>().params;
  // Dentro del WebView el sitio va sin su header/footer; fuera, completo.
  const embedUrl = toEmbedUrl(url);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // El estado de error desmonta el WebView, así que reintentar = remontarlo.
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setReloadKey(k => k + 1);
  }, []);

  // Links dentro del documento (correo de soporte, otro sitio): fuera del WebView.
  const handleShouldStartLoad = useCallback((request: WebViewNavigation) => {
    if (isInternalUrl(request.url)) return true;
    Linking.openURL(request.url).catch(() => {});
    return false;
  }, []);

  return (
    <View style={gs.screen}>
      <AppHeader title={title} showBack onBack={() => navigation.goBack()} />

      <View style={gs.flex1}>
        {hasError ? (
          <View style={styles.errorState}>
            <Icon name="wifi-off" size={48} color={colors.textTertiary} />
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}
              textAlign="center">
              No pudimos cargar el documento
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}
              textAlign="center">
              Revisa tu conexión a internet e inténtalo de nuevo.
            </CustomTextComponent>

            <CustomButtonComponent
              text="Reintentar"
              onPress={retry}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md }}
            />
          </View>
        ) : (
          <>
            <LegalWebView
              key={reloadKey}
              source={{ uri: embedUrl }}
              originWhitelist={['https://*']}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setHasError(true); }}
              onHttpError={() => { setIsLoading(false); setHasError(true); }}
              startInLoadingState={false}
              // Documentos estáticos: no necesitan almacenamiento ni multimedia.
              javaScriptEnabled
              domStorageEnabled={false}
              allowsBackForwardNavigationGestures={false}
              style={{ backgroundColor: colors.background }}
            />
            {isLoading && (
              <View style={[styles.loader, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  retryBtn: {
    borderRadius: RADIUS.md,
    minHeight: 48,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  },
});
