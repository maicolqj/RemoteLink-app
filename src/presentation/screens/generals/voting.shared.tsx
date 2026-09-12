import React from 'react';
import { View, StyleSheet } from 'react-native';

import CustomTextComponent from '../../components/CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import type { VotingResults } from '../../../domain/responses/VotingResponseModel';

export const VOTING_KIND_LABEL: Record<string, string> = {
  ASAMBLEA: 'Asamblea',
  CONSEJO:  'Reunión del consejo',
};

export const VOTING_STATUS_LABEL: Record<string, string> = {
  DRAFT:  'Borrador',
  OPEN:   'Abierta',
  CLOSED: 'Cerrada',
};

/** Cómo cuenta el voto, dicho como lo necesita leer el residente antes de votar. */
export const VOTING_WEIGHTING_NOTE: Record<string, string> = {
  COEFFICIENT: 'Vota una persona por unidad. El voto pesa según el coeficiente de copropiedad de tu unidad.',
  UNIT:        'Vota una persona por unidad y todas las unidades valen igual.',
  MEMBER:      'Vota cada miembro del consejo, un voto por persona.',
};

/** "58,3 %". Sin Intl: el formato tiene que salir igual en cualquier Android. */
export function votingPct(value: number): string {
  const rounded = Math.round(value * 1000) / 10;
  return `${String(rounded).replace('.', ',')} %`;
}

/** "12 sep, 19:00" — cuándo es la reunión. */
export function votingWhen(iso: string): string {
  const date = new Date(iso);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${months[date.getMonth()]}, ${hh}:${mm}`;
}

/**
 * Resultado de una pregunta cerrada.
 *
 * Una sola serie —el porcentaje de cada opción—, así que un solo color y sin
 * leyenda: el nombre de la opción va encima de su barra. Barras y no torta
 * porque en una votación importan las diferencias pequeñas. El porcentaje va en
 * la punta de la barra, con la cantidad de votos al lado.
 */
export function VoteResultBars({ results }: { results: VotingResults }) {
  const { colors } = useTheme();
  const noun = results.weighting === 'MEMBER' ? 'consejeros' : 'unidades';

  return (
    <View style={styles.wrap}>
      <View style={styles.rowBetween}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          Participación
        </CustomTextComponent>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}>
          {votingPct(results.participation)}
        </CustomTextComponent>
      </View>

      {/* Medidor: relleno sobre una pista del mismo azul más claro. */}
      <View
        accessible
        accessibilityLabel={`Participación ${votingPct(results.participation)}`}
        style={[styles.track, { backgroundColor: colors.primarySurface }]}>
        <View
          style={[
            styles.trackFill,
            { width: `${Math.min(100, results.participation * 100)}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
        {results.votedCount} de {results.eligibleCount} {noun} votaron
      </CustomTextComponent>

      {results.options.map(option => (
        <View
          key={option.optionId}
          accessible
          accessibilityLabel={`${option.text}: ${votingPct(option.share)}, ${option.votes} ${option.votes === 1 ? 'voto' : 'votos'}`}
          style={styles.option}>
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary}>
            {option.text}
          </CustomTextComponent>
          <View style={styles.barRow}>
            {/* Máximo 70 % del ancho: el resto es para las etiquetas de la punta. */}
            <View
              style={[
                styles.bar,
                {
                  width: `${option.share * 70}%`,
                  minWidth: option.votes > 0 ? 3 : 0,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              {votingPct(option.share)}
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
              {option.votes} {option.votes === 1 ? 'voto' : 'votos'}
            </CustomTextComponent>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  track: {
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  option: {
    marginTop: SPACING.sm,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  // Punta redondeada de 4 px y base recta: la barra crece desde la izquierda.
  bar: {
    height: 18,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
