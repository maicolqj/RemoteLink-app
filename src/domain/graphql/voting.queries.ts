import { gql } from '@apollo/client';

/**
 * Votaciones del residente.
 *
 * El servidor decide qué se ve: las asambleas para todos, las reuniones del
 * consejo solo para consejeros, y los resultados solo cuando la pregunta se
 * cierra. `myVoteOptionId` es el voto de la UNIDAD en asamblea: si otro
 * residente del apartamento ya votó, aquí aparece.
 */

export const VOTING_RESULTS_FIELDS = gql`
  fragment VotingResultsFields on VotingResults {
    weighting
    eligibleCount
    eligibleWeight
    votedCount
    votedWeight
    participation
    options {
      optionId
      text
      votes
      weight
      share
      shareOfEligible
    }
  }
`;

export const VOTING_QUESTION_FIELDS = gql`
  ${VOTING_RESULTS_FIELDS}
  fragment VotingQuestionFields on VotingQuestion {
    id
    meetingId
    position
    text
    description
    weighting
    secrecy
    status
    openedAt
    closedAt
    options {
      id
      position
      text
    }
    results {
      ...VotingResultsFields
    }
    myVoteOptionId
    viewerCanVote
    viewerHasVoiceOnly
  }
`;

export const GET_VOTING_ENABLED = gql`
  query VotingEnabled($complexId: String!) {
    votingEnabled(complexId: $complexId)
  }
`;

export const GET_MY_VOTING_MEETINGS = gql`
  ${VOTING_QUESTION_FIELDS}
  query MyVotingMeetings($complexId: String!) {
    myVotingMeetings(complexId: $complexId) {
      id
      kind
      title
      description
      scheduledAt
      questions {
        ...VotingQuestionFields
      }
    }
  }
`;

export const GET_VOTING_QUESTION = gql`
  ${VOTING_QUESTION_FIELDS}
  query VotingQuestion($questionId: String!) {
    votingQuestion(questionId: $questionId) {
      ...VotingQuestionFields
      meeting {
        id
        kind
        title
        scheduledAt
      }
    }
  }
`;

/** Un voto por unidad (asamblea) o por consejero. No se puede cambiar. */
export const CAST_VOTE = gql`
  ${VOTING_QUESTION_FIELDS}
  mutation CastVote($questionId: String!, $optionId: String!) {
    castVote(questionId: $questionId, optionId: $optionId) {
      ...VotingQuestionFields
      meeting {
        id
        kind
        title
        scheduledAt
      }
    }
  }
`;
