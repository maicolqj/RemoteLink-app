import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import CustomButtonComponent from './CustomButtonComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';

// Ver LegalScreen: con react-native-webview@14 las props no tipan en JSX.
const PdfWebView = WebView as unknown as React.ComponentType<WebViewProps>;

const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

interface Props {
  /** URL del PDF en el backend (mismo origen que `baseUrl`). */
  fileUrl: string;
  /** Origen del backend: la página se sirve "desde ahí" para pedir el PDF sin CORS. */
  baseUrl: string;
  token: string | null;
}

/**
 * Visor de PDF dentro de la app, sin librerías nativas: pdf.js en un WebView.
 *
 * La página se carga con `baseUrl` = el backend, así que pdf.js pide el PDF
 * como mismo origen y con el token en el encabezado: el archivo nunca tiene un
 * enlace público. Las páginas se pintan a medida que aparecen en pantalla, para
 * que un manual de 80 páginas no se coma la memoria del celular.
 */
export default function PdfViewer({ fileUrl, baseUrl, token }: Props) {
  const { colors, isDark } = useTheme();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const html = useMemo(() => {
    const bg = isDark ? '#0F172A' : '#E2E8F0';
    const config = JSON.stringify({ url: fileUrl, token });
    return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
<style>
  html,body{margin:0;padding:0;background:${bg};}
  #pages{padding:8px 0 24px;}
  .page{position:relative;margin:0 auto 10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);width:calc(100% - 16px);}
  .page canvas{display:block;width:100%;height:100%;}
  .num{position:absolute;right:6px;bottom:4px;font:11px sans-serif;color:#94A3B8;}
</style>
<script src="${PDFJS_BASE}/pdf.min.js"></script>
</head><body><div id="pages"></div>
<script>
(function(){
  var cfg = ${config};
  function post(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  if (!window.pdfjsLib) { post({type:'error', message:'No se pudo cargar el visor.'}); return; }
  // El worker debe ser del mismo origen: se trae su código y se sirve como blob.
  fetch('${PDFJS_BASE}/pdf.worker.min.js').then(function(r){ return r.text(); }).then(function(code){
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([code], {type:'text/javascript'}));
    var task = pdfjsLib.getDocument({
      url: cfg.url,
      httpHeaders: cfg.token ? { Authorization: 'Bearer ' + cfg.token } : {},
      disableRange: true, disableStream: true, withCredentials: false
    });
    task.onProgress = function(p){ if (p.total) post({type:'progress', value: p.loaded / p.total}); };
    return task.promise;
  }).then(function(pdf){
    post({type:'ready', pages: pdf.numPages});
    var container = document.getElementById('pages');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rendered = {};
    function render(n, el){
      if (rendered[n]) return; rendered[n] = true;
      pdf.getPage(n).then(function(page){
        var base = page.getViewport({scale:1});
        var scale = (el.clientWidth / base.width) * dpr;
        var vp = page.getViewport({scale: scale});
        var canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        el.insertBefore(canvas, el.firstChild);
        page.render({canvasContext: canvas.getContext('2d'), viewport: vp});
      });
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) render(Number(e.target.dataset.n), e.target); });
    }, {rootMargin: '600px 0px'});
    // Con la primera página se estima el alto de todas: el scroll queda estable.
    pdf.getPage(1).then(function(first){
      var v = first.getViewport({scale:1});
      for (var i = 1; i <= pdf.numPages; i++) {
        var el = document.createElement('div');
        el.className = 'page'; el.dataset.n = i;
        el.style.aspectRatio = v.width + ' / ' + v.height;
        var num = document.createElement('span'); num.className = 'num'; num.textContent = i + ' / ' + pdf.numPages;
        el.appendChild(num);
        container.appendChild(el);
        observer.observe(el);
      }
    });
  }).catch(function(err){
    var status = err && err.status;
    post({type:'error', message: status === 401 ? 'Tu sesión venció. Vuelve a abrir el documento.' : 'No se pudo abrir el PDF.'});
  });
})();
</script></body></html>`;
  }, [fileUrl, token, isDark]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as
        | { type: 'progress'; value: number }
        | { type: 'ready'; pages: number }
        | { type: 'error'; message: string };
      if (msg.type === 'progress') setProgress(msg.value);
      else if (msg.type === 'ready') { setPages(msg.pages); setState('ready'); }
      else setState('error');
    } catch {
      // Mensajes ajenos al visor.
    }
  }, []);

  const retry = useCallback(() => {
    setState('loading');
    setProgress(0);
    setReloadKey(k => k + 1);
  }, []);

  if (state === 'error') {
    return (
      <View style={styles.center}>
        <Icon name="picture-as-pdf" size={48} color={colors.textTertiary} />
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} textAlign="center">
          No pudimos abrir el PDF
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
          Revisa tu conexión e inténtalo de nuevo. También puedes descargarlo con el botón de compartir.
        </CustomTextComponent>
        <CustomButtonComponent
          text="Reintentar"
          onPress={retry}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md }}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <PdfWebView
        key={reloadKey}
        source={{ html, baseUrl }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled={false}
        setBuiltInZoomControls
        setDisplayZoomControls={false}
        onError={() => setState('error')}
        style={{ backgroundColor: colors.background }}
      />
      {state === 'loading' && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {progress > 0 ? `Descargando… ${Math.round(progress * 100)} %` : 'Abriendo el PDF…'}
          </CustomTextComponent>
        </View>
      )}
      {state === 'ready' && pages > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.overlay }]} pointerEvents="none">
          <CustomTextComponent fontSize={FONT_SIZE.xs} color="#fff">
            {pages} {pages === 1 ? 'página' : 'páginas'}
          </CustomTextComponent>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  retryBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
});
