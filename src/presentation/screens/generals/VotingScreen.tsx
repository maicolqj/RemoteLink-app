import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useVotingStore } from '../../store/voting.store';
import { fetchMyVotingMeetings } from '../../../infraestructure/services/voting.service';
import type { VotingMeeting, VotingQuestion } from '../../../domain/responses/VotingResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { VOTING_KIND_LABEL, votingWhen } from './voting.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Voting'>;

/**
 * Las votaciones del residente, por reunión.
 *
 * Se recarga cada vez que la pantalla gana foco: vuelve de votar, o la
 * administración acaba de abrir la siguiente pregunta de la asamblea.
 */
export default function VotingScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const [meetings, setMeetings] = useState<VotingMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!complexId) return;
    setIsLoading(true);
    try {
      setMeetings(await fetchMyVotingMeetings(complexId));
      setBlocked(null);
    } catch (e: any) {
      setBlocked(e?.message ?? 'No se pudieron cargar las votaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [complexId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // La administración abrió o cerró una pregunta, o apagó el módulo: llega por
  // socket y la lista se recarga sola. Si lo apagaron, la consulta falla y la
  // pantalla lo dice.
  const version = useVotingStore(state => state.version);
  useEffect(() => {
    if (version > 0) load();
  }, [version, load]);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Votaciones" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.primary]} />}>

        {isLoading && meetings.length === 0 && !blocked ? (
          <LoadingSpinner />
        ) : blocked ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {blocked}
            </CustomTextComponent>
          </View>
        ) : meetings.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              No hay votaciones publicadas por ahora. Cuando la administración abra una, te llega un aviso.
            </CustomTextComponent>
          </View>
        ) : (
          meetings.map(meeting => (
            <View key={meeting.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                {VOTING_KIND_LABEL[meeting.kind] ?? meeting.kind} · {votingWhen(meeting.scheduledAt)}
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.lg}
                fontWeight={FONT_WEIGHT.semibold as any}
                color={colors.textPrimary}>
                {meeting.title}
              </CustomTextComponent>

              {meeting.questions.map(question => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  onPress={() => navigation.navigate('VotingQuestion', { questionId: question.id })}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** Una pregunta y lo que le toca hacer al residente con ella. */
function QuestionRow({ question, onPress }: { question: VotingQuestion; onPress: () => void }) {
  const { colors } = useTheme();

  const state = question.status === 'CLOSED'
    ? { icon: 'bar-chart', text: 'Cerrada · ver resultados', color: colors.textTertiary }
    : question.viewerCanVote
      ? { icon: 'how-to-vote', text: 'Abierta · toca para votar', color: colors.primary }
      : question.myVoteOptionId
        ? { icon: 'check-circle', text: 'Voto registrado', color: colors.success }
        : { icon: 'schedule', text: 'Abierta', color: colors.textTertiary };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.question, { borderTopColor: colors.border }]}>
      <View style={styles.questionBody}>
        <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary}>
          {question.text}
        </CustomTextComponent>
        <View style={styles.stateRow}>
          <Icon name={state.icon} size={14} color={state.color} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={state.color}>
            {state.text}
          </CustomTextComponent>
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
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
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  questionBody: {
    flex: 1,
    gap: 2,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
