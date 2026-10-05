import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewProps } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PdfViewer from '../../components/PdfViewer';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import apolloClientInstance, { API_BASE_URL } from '../../../data/lib/apollo/client';
import { GET_MY_COMPLEX_DOCUMENT } from '../../../domain/graphql/complex-info.queries';
import type { MyComplexDocument } from '../../../domain/responses/ComplexInfoResponseModel';
import {
  complexDocumentFileUrl,
  getAccessToken,
  shareComplexDocumentPdf,
} from '../../../infraestructure/services/complex-info.service';
import { DOCUMENT_CATEGORY, formatDocDate, formatFileSize } from './complex-info.shared';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

// Ver LegalScreen: con react-native-webview@14 las props no tipan en JSX.
const ReaderWebView = WebView as unknown as React.ComponentType<WebViewProps>;

type View_ = 'text' | 'pdf';

/** Tamaños de letra del lector: el manual de convivencia es largo. */
const TEXT_SIZES = [15, 17, 19, 22];

/**
 * Un documento de "Mi Conjunto": su texto (del Word) con el tema de la app, o
 * el PDF oficial dentro de la app. Si la administración lleva registro de
 * lectura, abrirlo ya cuenta como leído (lo registra el servidor al
 * entregarlo) y abajo se le dice al residente.
 */
export default function ComplexDocumentScreen() {
  const navigation = useNavigation();
  const { documentId, title: initialTitle } = (useRoute().params ?? {}) as {
    documentId: string;
    title?: string;
  };
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const [item, setItem] = useState<MyComplexDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View_>('text');
  const [textSize, setTextSize] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await apolloClientInstance.query<{ myComplexDocument: MyComplexDocument }>({
        query: GET_MY_COMPLEX_DOCUMENT,
        variables: { id: documentId },
        fetchPolicy: 'network-only',
      });
      if (error) throw error;
      const doc = data?.myComplexDocument ?? null;
      setItem(doc);
      if (doc) setView(doc.hasContent ? 'text' : 'pdf');
      // La consulta anterior ya renovó el token si hacía falta: el PDF lo usa.
      setToken(await getAccessToken());
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo abrir el documento.');
    } finally {
      setLoading(false);
    }
  }, [documentId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const share = useCallback(async () => {
    if (!item?.document.fileName) return;
    setSharing(true);
    try {
      await shareComplexDocumentPdf(item.document.id, item.document.fileName, item.document.title);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo compartir el PDF.');
    } finally {
      setSharing(false);
    }
  }, [item, showError]);

  // Los enlaces del documento se abren fuera del lector.
  const handleShouldStartLoad = useCallback((request: WebViewNavigation) => {
    if (request.url.startsWith('about:') || request.url.startsWith('data:')) return true;
    Linking.openURL(request.url).catch(() => {});
    return false;
  }, []);

  const html = useMemo(() => {
    const content = item?.document.contentHtml;
    if (!content) return '';
    const c = colors;
    return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4">
<style>
  :root{color-scheme:${isDark ? 'dark' : 'light'};}
  body{margin:0;padding:20px 18px 40px;background:${c.background};color:${c.textPrimary};
    font-family:-apple-system,Roboto,'Segoe UI',sans-serif;font-size:${TEXT_SIZES[textSize]}px;line-height:1.6;
    word-wrap:break-word;overflow-wrap:anywhere;}
  h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.4em 0 .5em;color:${c.textPrimary};}
  h1{font-size:1.45em}h2{font-size:1.25em}h3{font-size:1.1em}
  p{margin:0 0 .9em;}
  a{color:${c.primary};}
  ul,ol{padding-left:1.4em;margin:0 0 .9em;} li{margin:.25em 0;}
  blockquote{margin:1em 0;padding:.5em 1em;border-left:3px solid ${c.primary};color:${c.textSecondary};}
  table{border-collapse:collapse;width:100%;margin:1em 0;display:block;overflow-x:auto;font-size:.9em;}
  th,td{border:1px solid ${c.border};padding:6px 8px;text-align:left;vertical-align:top;}
  th{background:${c.surface};}
  hr{border:0;border-top:1px solid ${c.border};margin:1.5em 0;}
</style></head><body>${content}</body></html>`;
  }, [item, colors, isDark, textSize]);

  const header = (
    <AppHeader
      title={item?.document.title ?? initialTitle ?? 'Documento'}
      showBack
      onBack={() => navigation.goBack()}
      rightActions={
        item?.hasFile
          ? [{ icon: 'share', onPress: share, accessibilityLabel: 'Compartir o guardar el PDF' }]
          : undefined
      }
    />
  );

  if (loading) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        {header}
        <LoadingSpinner />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        {header}
        <EmptyState
          icon="description"
          title="Documento no disponible"
          description="Puede que la administración lo haya retirado o actualizado."
        />
      </View>
    );
  }

  const { document: doc, acknowledgedAt, hasContent, hasFile } = item;
  const category = DOCUMENT_CATEGORY[doc.category];
  const meta = [
    doc.effectiveDate ? `Vigente desde ${formatDocDate(doc.effectiveDate)}` : null,
    `Actualizado ${formatDocDate(doc.contentUpdatedAt)}`,
    doc.version > 1 ? `Versión ${doc.version}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      {header}

      {/* ── Ficha del documento ─────────────────────────────── */}
      <View style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Icon name={category.icon} size={16} color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.primary}>
            {category.label.toUpperCase()}
          </CustomTextComponent>
        </View>
        {!!doc.description && (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {doc.description}
          </CustomTextComponent>
        )}
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {meta}
        </CustomTextComponent>

        {(hasContent && hasFile) || view === 'text' ? (
          <View style={styles.toolbar}>
            {hasContent && hasFile && (
              <View style={[styles.segment, { backgroundColor: colors.background }]}>
                {([
                  { key: 'text', label: 'Leer', icon: 'article' },
                  { key: 'pdf', label: `PDF${doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}`, icon: 'picture-as-pdf' },
                ] as const).map(s => {
                  const active = view === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.segmentBtn, active && { backgroundColor: colors.primary }]}
                      onPress={() => setView(s.key)}
                      activeOpacity={0.85}>
                      <Icon name={s.icon} size={14} color={active ? colors.textInverse : colors.textSecondary} />
                      <CustomTextComponent
                        fontSize={FONT_SIZE.xs}
                        fontWeight={FONT_WEIGHT.semibold as any}
                        color={active ? colors.textInverse : colors.textSecondary}>
                        {s.label}
                      </CustomTextComponent>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {view === 'text' && (
              <View style={styles.textSize}>
                <TouchableOpacity
                  onPress={() => setTextSize(s => Math.max(0, s - 1))}
                  disabled={textSize === 0}
                  style={[styles.sizeBtn, { borderColor: colors.border }]}
                  accessibilityLabel="Letra más pequeña">
                  <CustomTextComponent fontSize={FONT_SIZE.xs} color={textSize === 0 ? colors.textDisabled : colors.textPrimary}>
                    A−
                  </CustomTextComponent>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTextSize(s => Math.min(TEXT_SIZES.length - 1, s + 1))}
                  disabled={textSize === TEXT_SIZES.length - 1}
                  style={[styles.sizeBtn, { borderColor: colors.border }]}
                  accessibilityLabel="Letra más grande">
                  <CustomTextComponent
                    fontSize={FONT_SIZE.md}
                    color={textSize === TEXT_SIZES.length - 1 ? colors.textDisabled : colors.textPrimary}>
                    A+
                  </CustomTextComponent>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* ── Contenido ───────────────────────────────────────── */}
      <View style={gs.flex1}>
        {view === 'text' && hasContent ? (
          <ReaderWebView
            source={{ html }}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            javaScriptEnabled={false}
            domStorageEnabled={false}
            style={{ backgroundColor: colors.background }}
          />
        ) : hasFile ? (
          <PdfViewer fileUrl={complexDocumentFileUrl(doc.id)} baseUrl={API_BASE_URL} token={token} />
        ) : (
          <EmptyState icon="description" title="Sin contenido" description="Este documento no tiene texto ni PDF." />
        )}
        {sharing && (
          <View style={[styles.sharing, { backgroundColor: colors.overlayLight }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>

      {/* ── Registro de lectura ─────────────────────────────── */}
      {doc.requiresAcknowledgement && !!acknowledgedAt && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + SPACING.sm },
          ]}>
          <View style={styles.ackDone}>
            <Icon name="verified" size={20} color={colors.success} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              La administración ve que abriste este documento el {formatDocDate(acknowledgedAt)}.
            </CustomTextComponent>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.sm,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  textSize: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginLeft: 'auto',
  },
  sizeBtn: {
    width: 36,
    height: 32,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharing: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ackDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
});
