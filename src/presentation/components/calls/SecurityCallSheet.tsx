// =============================================================================
// "Llamar a portería" desde el inicio.
//
// Con varias porterías el residente elige a cuál se dirige y solo esa se
// entera, sea para pedir que le devuelvan la llamada o para llamar por la app
// (si el conjunto lo permite). Con una sola —o sin porterías creadas— no hay
// nada que elegir.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('IntercomCall');
    } catch (err) {
      onError(err instanceof Error && err.message ? err.message : 'No se pudo llamar a portería.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <CustomBottomModalComponent isVisible={visible} onClose={onClose} heightPercentage={0.6}>
      <View style={styles.content}>
        <CustomTextComponent style={[styles.title, { color: colors.textPrimary }]}>
          Llamar a portería
        </CustomTextComponent>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {posts.length > 1 && (
              <>
                <CustomTextComponent style={[styles.hint, { color: colors.textSecondary }]}>
                  ¿A qué portería? Solo esa recibe tu solicitud.
                </CustomTextComponent>
                {posts.map(post => {
                  const isSelected = post.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={post.id}
                      style={[
                        styles.option,
                        { borderColor: isSelected ? colors.primary : colors.border },
                      ]}
                      onPress={() => setSelectedId(post.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}>
                      <Icon
                        name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <View style={styles.optionText}>
                        <CustomTextComponent style={{ color: colors.textPrimary, fontWeight: '600' }}>
                          {post.name}
                        </CustomTextComponent>
                        {post.guardsOnDuty === 0 && (
                          <CustomTextComponent style={[styles.optionNote, { color: colors.textSecondary }]}>
                            Nadie conectado ahora
                          </CustomTextComponent>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <TouchableOpacity
              style={[styles.action, { backgroundColor: colors.primary }, mustChoose && styles.disabled]}
              onPress={handleRequest}
              disabled={mustChoose || requesting}>
              {requesting
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Icon name="support-agent" size={20} color="#fff" />
                    <CustomTextComponent style={styles.actionText}>Pedir que me llamen</CustomTextComponent>
                  </>}
            </TouchableOpacity>

            {appCallsEnabled && (
              <TouchableOpacity
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
          </>
        )}
      </View>
    </CustomBottomModalComponent>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 13, marginBottom: 4 },
  loader: { marginVertical: 24 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 14 },
  optionText: { flex: 1 },
  optionNote: { fontSize: 12, marginTop: 2 },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, marginTop: 6,
  },
  actionOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.45 },
});
