import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { createPqrf } from '../../../infraestructure/services/pqrf.service';
import type { PqrfAddressee, PqrfType } from '../../../domain/responses/PqrfResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { PQRF_ADDRESSEES, PQRF_TYPES, PQRF_TYPE_LABEL } from './pqrf.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PqrfCreate'>;

/**
 * Radicar un PQRF.
 *
 * El destinatario se elige con su explicación al lado, no con una lista seca:
 * la diferencia entre administración y consejo decide QUIÉN va a leer el
 * radicado, y elegir mal significa que la queja la lea justamente aquel de
 * quien uno se queja.
 */
export default function PqrfCreateScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const [type, setType] = useState<PqrfType>('PETICION');
  const [addressee, setAddressee] = useState<PqrfAddressee>('ADMINISTRACION');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!complexId) return;

    if (subject.trim().length < 5) {
      showError('El asunto debe tener al menos 5 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      showError('Cuéntanos un poco más: la descripción debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPqrf({
        complexId,
        type,
        addressee,
        subject: subject.trim(),
        description: description.trim(),
      });
      showSuccess(`Radicado ${created.code}. Te avisamos cuando respondan.`);
      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo radicar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Nuevo radicado" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}>
          ¿De qué se trata?
        </CustomTextComponent>

        <View style={styles.chips}>
          {PQRF_TYPES.map(value => {
            const isActive = type === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setType(value)}
                style={[styles.chip, { backgroundColor: isActive ? colors.primary : colors.surface }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {PQRF_TYPE_LABEL[value]}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          ¿A quién va dirigido?
        </CustomTextComponent>

        {PQRF_ADDRESSEES.map(option => {
          const isActive = addressee === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setAddressee(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}>
              <Icon
                name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <View style={gs.flex1}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.md}
                  fontWeight={FONT_WEIGHT.medium as any}
                  color={colors.textPrimary}>
                  {option.label}
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                  {option.hint}
                </CustomTextComponent>
              </View>
            </TouchableOpacity>
          );
        })}

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          Asunto
        </CustomTextComponent>
        <CustomInputComponent
          value={subject}
          onChangeText={setSubject}
          placeholder="Resume en una línea"
          maxLength={200}
        />

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          Cuéntanos
        </CustomTextComponent>
        <CustomInputComponent
          value={description}
          onChangeText={setDescription}
          placeholder="Describe lo que pasó con el mayor detalle posible"
          multiline
          numberOfLines={6}
          maxLength={5000}
        />

        {/* El radicado queda como constancia con fecha y número, así que no se
            puede editar después: vale la pena advertirlo antes de enviarlo. */}
        <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
          <Icon name="info-outline" size={16} color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
            Al enviarlo recibes un número de radicado. El texto no se puede modificar después.
          </CustomTextComponent>
        </View>

        <CustomButtonComponent
          text="Radicar"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
          loaderColor={colors.textInverse}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  sectionTitle: {
    marginTop: SPACING.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  primaryBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
});
