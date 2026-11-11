// =============================================================================
// "Llamar a portería" desde el inicio.
//
// Con varias porterías el residente elige a cuál se dirige y solo esa se
// entera, sea para pedir que le devuelvan la llamada o para llamar por la app
// (si el conjunto lo permite). Con una sola —o sin porterías creadas— no hay
// nada que elegir.
//
// La hoja toma los colores del tema (claro/oscuro) y mide lo justo para su
// contenido; con muchas porterías la lista se desplaza y los botones quedan
// siempre a la vista.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMutation } from '@apollo/client/react';
import { useNavigation } from '@react-navigation/native';

import CustomBottomModalComponent from '../CustomBottomModalComponent';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import apolloClient from '../../../data/lib/apollo/client';
import { REQUEST_SECURITY_CALL } from '../../../domain/graphql/security.mutations';
import { GET_COMPLEX_INTERCOM_SETTINGS, GET_SECURITY_POSTS } from '../../../domain/graphql/intercom';
import { intercomCallService } from '../../../infraestructure/services/intercomCall.service';
import { pickSecurityPost, type SecurityPostChoice } from '../../utils/securityPosts';

type Props = {
  visible: boolean;
  complexId?: string;
  onClose: () => void;
  onRequested: (message: string) => void;
  onError: (message: string) => void;
};

const ON_PRIMARY = '#FFFFFF';

export function SecurityCallSheet({ visible, complexId, onClose, onRequested, onError }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [posts, setPosts] = useState<SecurityPostChoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [appCallsEnabled, setAppCallsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [requestSecurityCall, { loading: requesting }] = useMutation(REQUEST_SECURITY_CALL);

  useEffect(() => {
    if (!visible || !complexId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apolloClient
        .query<{ securityPosts: SecurityPostChoice[] }>({
          query: GET_SECURITY_POSTS,
          variables: { complexId },
          fetchPolicy: 'no-cache',
        })
        .then(r => r.data?.securityPosts ?? [])
        .catch(() => [] as SecurityPostChoice[]),
      apolloClient
        .query<{ complex: { intercomMode?: string | null; residentIntercomCallsEnabled?: boolean | null } | null }>({
          query: GET_COMPLEX_INTERCOM_SETTINGS,
          variables: { id: complexId },
          fetchPolicy: 'no-cache',
        })
        .then(r => r.data?.complex?.intercomMode === 'INTERNET' && !!r.data?.complex?.residentIntercomCallsEnabled)
        .catch(() => false),
    ]).then(([loadedPosts, appCalls]) => {
      if (cancelled) return;
      setPosts(loadedPosts);
      setSelectedId(current => pickSecurityPost(loadedPosts, current)?.id);
      setAppCallsEnabled(appCalls);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visible, complexId]);

  const selected = posts.find(p => p.id === selectedId);
  const mustChoose = posts.length > 1 && !selected;

  const handleRequest = async () => {
    if (!complexId || mustChoose) return;
    try {
      const { data } = await requestSecurityCall({
        variables: { complexId, securityPostId: selected?.id ?? null },
      });
      const res = (data as { requestSecurityCall?: { success: boolean; message?: string | null } } | undefined)
        ?.requestSecurityCall;
      if (res?.success === false) {
        onError(res.message ?? 'No hay personal de seguridad disponible en este momento.');
        return;
      }
      onClose();
      onRequested(
        selected
          ? `${selected.name} recibió tu solicitud y te llamará en breve.`
          : 'Portería recibió tu solicitud y te llamará en breve.',
      );
    } catch {
      onError('No se pudo enviar la solicitud. Intenta de nuevo.');
    }
  };

  const handleAppCall = async () => {
    if (!complexId || mustChoose || calling) return;
    setCalling(true);
    try {
      await intercomCallService.startToSecurity({
        complexId,
        securityPostId: selected?.id,
        securityPostName: selected?.name,
      });
      onClose();
      (navigation as any).navigate('IntercomCall');
    } catch (err) {
      onError(err instanceof Error && err.message ? err.message : 'No se pudo llamar a portería.');
    } finally {
      setCalling(false);
    }
  };

  const subtitle = posts.length > 1
    ? '¿A qué portería? Solo esa recibe tu solicitud.'
    : selected
      ? `Tu solicitud llega a ${selected.name}.`
      : 'Tu solicitud llega al personal de portería.';

  return (
    <CustomBottomModalComponent
      isVisible={visible}
      onClose={onClose}
      autoHeight
      backgroundColor={colors.surface}
      handleColor={colors.border}
      overlayColor={colors.overlay}
      paddingHorizontal={20}
      paddingBottom={28}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySurface }]}>
          <Icon name="security" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <CustomTextComponent style={[styles.title, { color: colors.textPrimary }]}>
            Llamar a portería
          </CustomTextComponent>
          {!loading && (
            <CustomTextComponent style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </CustomTextComponent>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {posts.length > 1 && (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {posts.map(post => {
                const isSelected = post.id === selectedId;
                const online = post.guardsOnDuty > 0;
                return (
                  <TouchableOpacity
                    key={post.id}
                    activeOpacity={0.8}
                    style={[
                      styles.option,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primarySurface : colors.background,
                      },
                    ]}
                    onPress={() => setSelectedId(post.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}>
                    <Icon
                      name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textTertiary}
                    />
                    <View style={styles.optionText}>
                      <CustomTextComponent
                        style={[styles.optionName, { color: colors.textPrimary }]}
                        numberOfLines={1}>
                        {post.name}
                      </CustomTextComponent>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: online ? colors.success : colors.textTertiary },
                          ]}
                        />
                        <CustomTextComponent style={[styles.optionNote, { color: colors.textSecondary }]}>
                          {online
                            ? `${post.guardsOnDuty} ${post.guardsOnDuty === 1 ? 'vigilante conectado' : 'vigilantes conectados'}`
                            : 'Nadie conectado ahora'}
                        </CustomTextComponent>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.action, { backgroundColor: colors.primary }, mustChoose && styles.disabled]}
              onPress={handleRequest}
              disabled={mustChoose || requesting}>
              {requesting
                ? <ActivityIndicator color={ON_PRIMARY} />
                : <>
                    <Icon name="support-agent" size={20} color={ON_PRIMARY} />
                    <CustomTextComponent style={[styles.actionText, { color: ON_PRIMARY }]}>
                      Pedir que me llamen
                    </CustomTextComponent>
                  </>}
            </TouchableOpacity>

            {appCallsEnabled && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.action, styles.actionOutline, { borderColor: colors.primary }, mustChoose && styles.disabled]}
                onPress={handleAppCall}
                disabled={mustChoose || calling}>
                {calling
                  ? <ActivityIndicator color={colors.primary} />
                  : <>
                      <Icon name="call" size={20} color={colors.primary} />
                      <CustomTextComponent style={[styles.actionText, { color: colors.primary }]}>
                        Llamar por la app
                      </CustomTextComponent>
                    </>}
              </TouchableOpacity>
            )}

            {mustChoose && (
              <CustomTextComponent style={[styles.chooseHint, { color: colors.textSecondary }]}>
                Elige una portería para continuar.
              </CustomTextComponent>
            )}
          </View>
        </>
      )}
    </CustomBottomModalComponent>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  loader: { marginVertical: 28 },
  // Con muchas porterías la lista se desplaza y los botones quedan a la vista.
  list: { maxHeight: SCREEN_H * 0.45, flexGrow: 0 },
  listContent: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  optionText: { flex: 1 },
  optionName: { fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  optionNote: { fontSize: 13 },
  actions: { gap: 10, marginTop: 20 },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, minHeight: 52, paddingHorizontal: 16,
  },
  actionOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  actionText: { fontWeight: '700', fontSize: 16 },
  chooseHint: { fontSize: 13, textAlign: 'center' },
  disabled: { opacity: 0.45 },
});
