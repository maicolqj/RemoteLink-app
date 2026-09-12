export type VotingMeetingKind = 'ASAMBLEA' | 'CONSEJO';
export type VoteWeighting = 'COEFFICIENT' | 'UNIT' | 'MEMBER';
export type VoteSecrecy = 'NOMINAL' | 'SECRET';
export type VotingQuestionStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface VotingOption {
  id: string;
  position: number;
  text: string;
}

export interface VotingOptionResult {
  optionId: string;
  text: string;
  votes: number;
  weight: number;
  /** Fracción de los votos emitidos (0 a 1). */
  share: number;
  /** Fracción de todos los habilitados para votar (0 a 1). */
  shareOfEligible: number;
}

export interface VotingResults {
  weighting: VoteWeighting;
  eligibleCount: number;
  eligibleWeight: number;
  votedCount: number;
  votedWeight: number;
  participation: number;
  options: VotingOptionResult[];
}

export interface VotingQuestion {
  id: string;
  meetingId: string;
  position: number;
  text: string;
  description?: string | null;
  weighting: VoteWeighting;
  secrecy: VoteSecrecy;
  status: VotingQuestionStatus;
  openedAt?: string | null;
  closedAt?: string | null;
  options: VotingOption[];
  /** Solo llega cuando la pregunta está cerrada. */
  results?: VotingResults | null;
  /** Lo que votó quien consulta; en asamblea, su unidad. */
  myVoteOptionId?: string | null;
  viewerCanVote: boolean;
  /** Es del consejo pero solo tiene voz: ve la pregunta sin poder votarla. */
  viewerHasVoiceOnly?: boolean;
  meeting?: { id: string; kind: VotingMeetingKind; title: string; scheduledAt: string } | null;
}

export interface VotingMeeting {
  id: string;
  kind: VotingMeetingKind;
  title: string;
  description?: string | null;
  scheduledAt: string;
  questions: VotingQuestion[];
}
