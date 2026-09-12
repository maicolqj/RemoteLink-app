import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useVotingStore } from '../../store/voting.store';
import { castVote, fetchVotingQuestion } from '../../../infraestructure/services/voting.service';
import type { VotingQuestion } from '../../../domain/responses/VotingResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  VOTING_KIND_LABEL, VOTING_STATUS_LABEL, VOTING_WEIGHTING_NOTE, VoteResultBars, votingWhen,
} from './voting.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'VotingQuestion'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'VotingQuestion'>;

/**
 * Una pregunta: votar, ver lo que se votó y, al cerrarse, los resultados.
 *
 * El voto se confirma antes de enviarse porque es definitivo y, en asamblea,
 * cuenta por toda la unidad: después de él, nadie más del apartamento puede
 * votar esa pregunta.
 */
export default function VotingQuestionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess, showAlert } = useAlert();

  const [question, setQuestion] = useState<VotingQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setQuestion(await fetchVotingQuestion(route.params.questionId));
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar la votación.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.questionId, showError]);

  useEffect(() => { load(); }, [load]);

  // Si la administración cierra la pregunta mientras el residente la mira, los
  // resultados aparecen sin que tenga que recargar.
  const version = useVotingStore(state => state.version);
  useEffect(() => {
    if (version > 0) load();
  }, [version, load]);

  const submit = async (optionId: string) => {
    setIsSubmitting(true);
    try {
      setQuestion(await castVote(route.params.questionId, optionId));
      showSuccess('Tu voto quedó registrado.');
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo registrar el voto.');
      // Si otro residente de la unidad votó primero, la ficha tiene que decirlo.
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmVote = () => {
    if (!question || !selected) return;
    const option = question.options.find(item => item.id === selected);
    const isMember = question.weighting === 'MEMBER';

    showAlert({
      type: 'question',
      title: 'Confirmar voto',
      description: `Vas a votar "${option?.text ?? ''}". ${isMember
        ? 'El voto es definitivo.'
        : 'El voto cuenta por toda tu unidad y es definitivo: nadie más de tu unidad podrá votar esta pregunta.'}`,
      buttons: [
        { text: 'Cancelar', style: 'text', onPress: () => {} },
        { text: 'Votar', style: 'primary', onPress: () => { submit(selected); } },
      ],
    });
  };

  if (isLoading || !question) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Votación" showBack onBack={() => navigation.goBack()} />
        {isLoading ? <LoadingSpinner /> : null}
      </View>
    );
  }

  const isOpen = question.status === 'OPEN';
  const isClosed = question.status === 'CLOSED';
  const isMember = question.weighting === 'MEMBER';
  const myOption = question.options.find(option => option.id === question.myVoteOptionId);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={question.meeting?.title ?? 'Votación'} showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.head}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {question.meeting ? `${VOTING_KIND_LABEL[question.meeting.kind] ?? ''} · ${votingWhen(question.meeting.scheduledAt)}` : ''}
            </CustomTextComponent>
            <View style={[styles.badge, { backgroundColor: isOpen ? colors.success : colors.textTertiary }]}>
              <CustomTextComponent fontSize={11} color={colors.textInverse}>
                {VOTING_STATUS_LABEL[question.status] ?? question.status}
              </CustomTextComponent>
            </View>
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            {question.text}
          </CustomTextComponent>

          {!!question.description && (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
              {question.description}
            </CustomTextComponent>
          )}

          <View style={styles.noteRow}>
            <Icon name="info-outline" size={15} color={colors.textTertiary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary} style={gs.flex1}>
              {VOTING_WEIGHTING_NOTE[question.weighting]}
              {question.secrecy === 'SECRET' ? ' El voto es secreto: nadie ve qué votó cada quien.' : ''}
            </CustomTextComponent>
          </View>
        </View>

        {question.viewerCanVote && (
          <>
            {question.options.map(option => {
              const isActive = selected === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSelected(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.option,
                    { backgroundColor: colors.surface, borderColor: isActive ? colors.primary : colors.border },
                  ]}>
                  <Icon
                    name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                  <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary} style={gs.flex1}>
                    {option.text}
                  </CustomTextComponent>
                </TouchableOpacity>
              );
            })}

            <CustomButtonComponent
              text="Votar"
              onPress={confirmVote}
              isLoading={isSubmitting}
              disabled={!selected || isSubmitting}
              loaderColor={colors.textInverse}
              style={[styles.primaryBtn, { backgroundColor: selected ? colors.primary : colors.textTertiary }]}
              textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
            />
          </>
        )}

        {!!myOption && (
          <View style={[styles.notice, { backgroundColor: colors.successLight }]}>
            <Icon name="check-circle" size={18} color={colors.success} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
              {isMember ? 'Votaste' : 'Tu unidad votó'}: {myOption.text}
            </CustomTextComponent>
          </View>
        )}

        {isOpen && !!question.viewerHasVoiceOnly && (
          <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
            <Icon name="record-voice-over" size={18} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              En el consejo tienes voz pero no voto: puedes seguir la votación, pero tu voto no cuenta.
            </CustomTextComponent>
          </View>
        )}

        {isOpen && !question.viewerCanVote && !myOption && !question.viewerHasVoiceOnly && (
          <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
            <Icon name="block" size={18} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              No estás habilitado para votar esta pregunta.
            </CustomTextComponent>
          </View>
        )}

        {/* Los resultados en vivo empujan a votar por lo que va ganando: se
            publican al cerrar. */}
        {isOpen && (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary} textAlign="center">
            Los resultados se publican cuando la administración cierre la votación.
          </CustomTextComponent>
        )}

        {isClosed && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Resultados
            </CustomTextComponent>
            {question.results ? (
              <VoteResultBars results={question.results} />
            ) : (
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Los resultados no están disponibles.
              </CustomTextComponent>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
});
