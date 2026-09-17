import apolloClient from '../../data/lib/apollo/client';
import {
  GET_VOTING_ENABLED,
  GET_MY_VOTING_MEETINGS,
  GET_VOTING_QUESTION,
  CAST_VOTE,
} from '../../domain/graphql/voting.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { VotingMeeting, VotingQuestion } from '../../domain/responses/VotingResponseModel';

/**
 * Todo va con `network-only`: en plena asamblea la administración abre y cierra
 * preguntas cada pocos minutos, y lo que quedó en caché ya no es cierto.
 */

/** Si la administración le muestra el módulo a los residentes. */
export async function fetchVotingEnabled(complexId: string): Promise<boolean> {
  const { data } = await apolloClient.query<{ votingEnabled: boolean }>({
    query: GET_VOTING_ENABLED,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return !!data?.votingEnabled;
}

export async function fetchMyVotingMeetings(complexId: string): Promise<VotingMeeting[]> {
  const { data, error } = await apolloClient.query<{ myVotingMeetings: VotingMeeting[] }>({
    query: GET_MY_VOTING_MEETINGS,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudieron cargar las votaciones'));
  return data?.myVotingMeetings ?? [];
}

export async function fetchVotingQuestion(questionId: string): Promise<VotingQuestion> {
  const { data, error } = await apolloClient.query<{ votingQuestion: VotingQuestion }>({
    query: GET_VOTING_QUESTION,
    variables: { questionId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar la votación'));
  return data!.votingQuestion;
}

export async function castVote(questionId: string, optionId: string): Promise<VotingQuestion> {
  const { data, error } = await apolloClient.mutate<{ castVote: VotingQuestion }>({
    mutation: CAST_VOTE,
    variables: { questionId, optionId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo registrar el voto'));
  return data!.castVote;
}
