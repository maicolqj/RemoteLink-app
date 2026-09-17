import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useMaintenanceStore } from '../../store/maintenance.store';
import type {
  MaintenanceEvent,
  MaintenanceTicket,
} from '../../../domain/responses/MaintenanceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  MAINTENANCE_CATEGORY_LABEL,
  MAINTENANCE_PRIORITY_LABEL,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_VARIANT,
  formatDateTime,
  isOpenTicket,
  isOverdue,
  locationLabel,
} from './maintenance.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'MaintenanceDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'MaintenanceDetail'>;

/** Qué ícono lleva cada renglón de la bitácora. */
const EVENT_ICON: Record<string, string> = {
  CREATED: 'flag',
  TRIAGED: 'fact-check',
  ASSIGNED: 'engineering',
  STATUS_CHANGED: 'sync',
  PROGRESS: 'photo-camera',
  COMMENT: 'chat-bubble-outline',
  RESOLVED: 'task-alt',
  REOPENED: 'replay',
  CLOSED: 'lock',
  RATED: 'star',
  ENDORSED: 'group-add',
  SLA_BREACHED: 'schedule',
};

const RATINGS = [1, 2, 3, 4, 5];

/**
 * El seguimiento de un daño, como lo ve el residente.
 *
 * La bitácora es el corazón de la pantalla: "en reparación" no le dice nada a
 * nadie, y "el técnico de ascensores vino, falta la tarjeta electrónica, llega
 * el jueves" sí. Las notas internas de la administración no llegan hasta aquí —
 * el servidor las recorta—, así que lo que se ve es lo que se puede contar.
 */
export default function MaintenanceDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess, showAlert } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const userId = resident?.user?.id;

  const refreshOne = useMaintenanceStore(state => state.refreshOne);
  const endorse = useMaintenanceStore(state => state.endorse);
  const rate = useMaintenanceStore(state => state.rate);
  const reopen = useMaintenanceStore(state => state.reopen);
  const comment = useMaintenanceStore(state => state.comment);

  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setTicket(await refreshOne(route.params.ticketId));
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar el reporte.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshOne, route.params.ticketId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading && !ticket) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Reporte" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (!ticket) return null;

  const isMine = ticket.reportedByUserId === userId;
  const canEndorse = !isMine && isOpenTicket(ticket);
  const canRate = isMine && ticket.status === 'RESOLVED';
  const canReopen =
    isMine && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED');

  const run = async (action: () => Promise<MaintenanceTicket>, ok: string) => {
    setIsSaving(true);
    try {
      setTicket(await action());
      showSuccess(ok);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo completar la acción.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndorse = () =>
    run(
      () => endorse(ticket.id),
      'Te sumaste al reporte. Ahora recibes sus novedades.',
    );

  const handleComment = async () => {
    if (message.trim().length < 2) return;
    await run(() => comment(ticket.id, message.trim()), 'Comentario enviado.');
    setMessage('');
  };

  const handleRate = async () => {
    if (rating === 0) {
      showError('Elige de 1 a 5 estrellas.');
      return;
    }
    await run(
      () => rate(ticket.id, rating, ratingComment.trim() || undefined),
      'Gracias. El ticket queda cerrado.',
    );
    setRatingComment('');
  };

  /**
   * Reabrir pide el motivo porque es lo que el técnico va a leer antes de
   * volver: "sigue goteando, ahora en el piso de abajo" es una orden de
   * trabajo; "no sirvió" es una discusión.
   */
  const handleReopen = () => {
    showAlert({
      type: 'question',
      title: '¿El arreglo no sirvió?',
      description:
        'Cuéntanos qué quedó mal en el comentario y lo devolvemos al tablero con el mismo número. Solo se puede reabrir una vez.',
      buttons: [
        {
          text: 'Reabrir',
          icon: 'replay',
          iconLibrary: 'MaterialIcons',
          onPress: () => {
            if (message.trim().length < 10) {
              showError(
                'Escribe primero en el comentario qué quedó mal, con algo de detalle.',
              );
              return;
            }
            void run(
              () => reopen(ticket.id, message.trim()),
              'Reporte reabierto. La administración ya fue avisada.',
            ).then(() => setMessage(''));
          },
        },
        { text: 'Cancelar', style: 'text', onPress: () => undefined },
      ],
    });
  };

  const renderEvent = (event: MaintenanceEvent) => (
    <View key={event.id} style={styles.eventRow}>
      <View style={[styles.eventIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon
          name={EVENT_ICON[event.type] ?? 'circle'}
          size={14}
          color={colors.primary}
        />
      </View>

      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary}>
          {event.message ??
            (event.toStatus
              ? MAINTENANCE_STATUS_LABEL[event.toStatus] ?? event.toStatus
              : '')}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {[event.authorName, formatDateTime(event.createdAt)]
            .filter(Boolean)
            .join(' · ')}
        </CustomTextComponent>

        {!!event.imageUrls?.length && (
          <View style={styles.photos}>
            {event.imageUrls.map(url => (
              <TouchableOpacity key={url} onPress={() => setViewerUri(url)}>
                <Image source={{ uri: url }} style={styles.eventThumb} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={ticket.code} showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            colors={[colors.primary]}
          />
        }>
        <Card>
          <View style={gs.rowBetween}>
            <CustomTextComponent
              fontSize={FONT_SIZE.lg}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}
              style={gs.flex1}>
              {ticket.title}
            </CustomTextComponent>
            <StatusChip
              label={MAINTENANCE_STATUS_LABEL[ticket.status] ?? ticket.status}
              variant={MAINTENANCE_STATUS_VARIANT[ticket.status] ?? 'neutral'}
            />
          </View>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {MAINTENANCE_CATEGORY_LABEL[ticket.category] ?? ticket.category} ·
            urgencia {MAINTENANCE_PRIORITY_LABEL[ticket.priority]?.toLowerCase()}
          </CustomTextComponent>

          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            color={colors.textPrimary}
            style={styles.description}>
            {ticket.description}
          </CustomTextComponent>

          <View style={styles.metaItem}>
            <Icon name="place" size={14} color={colors.textTertiary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {locationLabel(ticket)}
            </CustomTextComponent>
          </View>

          {ticket.endorsementCount > 0 && (
            <View style={styles.metaItem}>
              <Icon name="group" size={14} color={colors.textTertiary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                {ticket.endorsementCount + 1} vecinos reportaron lo mismo
              </CustomTextComponent>
            </View>
          )}

          {!!ticket.photoUrls?.length && (
            <View style={styles.photos}>
              {ticket.photoUrls.map(url => (
                <TouchableOpacity key={url} onPress={() => setViewerUri(url)}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Lo que el residente realmente quiere saber: cuándo viene el técnico. */}
        {(ticket.scheduledFor || ticket.vendor || ticket.assignedUser) && (
          <Card style={{ backgroundColor: colors.infoLight }}>
            <View style={styles.metaItem}>
              <Icon name="engineering" size={16} color={colors.info} />
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textPrimary}
                style={gs.flex1}>
                {ticket.vendor?.name ??
                  `${ticket.assignedUser?.name ?? ''} ${ticket.assignedUser?.lastName ?? ''}`.trim() ??
                  'Personal asignado'}
                {ticket.scheduledFor
                  ? ` · llega ${formatDateTime(ticket.scheduledFor)}`
                  : ''}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {isOverdue(ticket) && (
          <Card style={{ backgroundColor: colors.warningLight }}>
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color={colors.warning} />
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textPrimary}
                style={gs.flex1}>
                Este reporte pasó el plazo que la administración se comprometió a
                cumplir. Ya le llegó el aviso.
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {ticket.status === 'RESOLVED' && !!ticket.resolutionNotes && (
          <Card style={{ backgroundColor: colors.successLight }}>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Lo que hicieron
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {ticket.resolutionNotes}
            </CustomTextComponent>

            {!!ticket.closurePhotoUrls?.length && (
              <View style={styles.photos}>
                {ticket.closurePhotoUrls.map(url => (
                  <TouchableOpacity key={url} onPress={() => setViewerUri(url)}>
                    <Image source={{ uri: url }} style={styles.thumb} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Calificar cierra el ticket: es la confirmación de quien reportó. */}
        {canRate && (
          <Card>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              ¿Quedó bien?
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Confirmar cierra el reporte. Si el arreglo no sirvió, reábrelo en
              vez de calificar bajo.
            </CustomTextComponent>

            <View style={styles.stars}>
              {RATINGS.map(value => (
                <TouchableOpacity key={value} onPress={() => setRating(value)}>
                  <Icon
                    name={value <= rating ? 'star' : 'star-border'}
                    size={30}
                    color={value <= rating ? colors.warning : colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <CustomInputComponent
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Comentario (opcional)"
              maxLength={1000}
            />

            <Button
              label="Confirmar y cerrar"
              icon="task-alt"
              onPress={handleRate}
              loading={isSaving}
              disabled={isSaving}
              fullWidth
            />
          </Card>
        )}

        {ticket.rating != null && (
          <Card>
            <View style={styles.metaItem}>
              <Icon name="star" size={16} color={colors.warning} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Calificaste la atención con {ticket.rating}/5
                {ticket.ratingComment ? ` — ${ticket.ratingComment}` : ''}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          Qué ha pasado
        </CustomTextComponent>

        <Card>
          {(ticket.events ?? []).length === 0 ? (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
              Sin novedades todavía.
            </CustomTextComponent>
          ) : (
            (ticket.events ?? []).map(renderEvent)
          )}
        </Card>

        <CustomInputComponent
          value={message}
          onChangeText={setMessage}
          placeholder="Agregar un comentario al reporte"
          multiline
          numberOfLines={3}
          maxLength={2000}
        />

        <View style={styles.actions}>
          <Button
            label="Comentar"
            icon="send"
            variant="secondary"
            onPress={handleComment}
            disabled={isSaving || message.trim().length < 2}
            style={gs.flex1}
          />

          {canEndorse && (
            <Button
              label="A mí también"
              icon="group-add"
              onPress={handleEndorse}
              loading={isSaving}
              disabled={isSaving}
              style={gs.flex1}
            />
          )}
        </View>

        {canReopen && (
          <Button
            label="Sigue dañado"
            icon="replay"
            variant="danger"
            onPress={handleReopen}
            disabled={isSaving}
            fullWidth
          />
        )}
      </ScrollView>

      <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
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
  description: {
    marginVertical: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
  },
  eventRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  eventIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});
