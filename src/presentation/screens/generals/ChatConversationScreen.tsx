import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageViewerModal from '../../components/ImageViewerModal';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import { useAuthStore } from '../../store/auth.store';
import { usePanicStore } from '../../store/panic.store';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import {
  onChatMessage,
  onChatRead,
  useMarketplaceChatStore,
} from '../../store/marketplace-chat.store';
import {
  blockCounterpart,
  chatImageUrl,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  reportConversation,
  sendChatImage,
  sendMessage,
  shareMyPhone,
  unblockCounterpart,
} from '../../../infraestructure/services/marketplace-chat.service';
import type {
  ChatMessage,
  ChatReportReason,
  Conversation,
} from '../../../domain/responses/MarketplaceChatResponseModel';
import type { PhotoUpload } from '../../../domain/interfaces/PhotoUpload';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { bubbleTime, dayLabel, sameDay } from './chat.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ChatConversation'>;
type ChatRoute = RouteProp<HomeStackParamList, 'ChatConversation'>;

/**
 * Un mensaje en pantalla: los que van saliendo llevan su estado de envío, y
 * una foto que se está subiendo lleva el archivo local para verse de una vez
 * (y para reintentar si falla).
 */
type UiMessage = ChatMessage & {
  pending?: boolean;
  failed?: boolean;
  photo?: PhotoUpload;
};

const REPORT_OPTIONS: { value: ChatReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Me acosa o insiste' },
  { value: 'SCAM', label: 'Parece una estafa' },
  { value: 'OFFENSIVE', label: 'Ofensivo o amenazante' },
  { value: 'SPAM', label: 'Mensajes repetidos o publicidad' },
];

const CLOSED_HINT: Record<string, string> = {
  SOLD: 'El aviso se cerró',
  EXPIRED: 'El aviso venció',
  REMOVED: 'El aviso se retiró',
};

/**
 * Una conversación entre quien publicó y quien se interesó.
 *
 * Nadie ve el teléfono del otro: el número solo aparece si su dueño toca
 * "Compartir mi WhatsApp", y entonces llega como un mensaje con los botones
 * para escribirle o llamarlo. La administración no lee estos chats.
 *
 * La lista va invertida (lo más nuevo abajo, como cualquier app de mensajes)
 * y al subir se cargan los mensajes más viejos.
 */
export default function ChatConversationScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ChatRoute>();
  const conversationId = params.conversationId;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showAlert, showError, showSuccess } = useAlert();
  const { choosePhoto } = usePhotoPicker();
  const token = useAuthStore(state => state.token);

  /** Las fotos del chat no son públicas: se piden con la sesión. */
  const authHeaders = useMemo<Record<string, string> | undefined>(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );
  const [zoomed, setZoomed] = useState<string | null>(null);

  const setActiveConversation = useMarketplaceChatStore(
    state => state.setActiveConversation,
  );
  const discountUnread = useMarketplaceChatStore(state => state.discountUnread);
  const setFabLift = usePanicStore(state => state.setFabLift);

  /**
   * La barra de escribir mide distinto según el teclado, el alto del texto y
   * la barra del sistema: se mide en vivo y el botón de pánico sube lo mismo.
   */
  const liftPanicAbove = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) =>
      setFabLift(event.nativeEvent.layout.height + SPACING.sm),
    [setFabLift],
  );

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sharing, setSharing] = useState(false);

  const markRead = useCallback(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  const load = useCallback(async () => {
    try {
      const [conv, page] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ]);
      setConversation(conv);
      setMessages(page.items);
      setHasMore(page.hasMore);
      if (conv.unreadCount > 0) {
        discountUnread(conv.unreadCount);
        markRead();
      }
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo abrir la conversación.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, discountUnread, markRead, showError, navigation]);

  /**
   * Mientras la pantalla está al frente, esta es "la conversación abierta": el
   * push de sus mensajes no se muestra y no suman al número del ícono.
   */
  useFocusEffect(
    useCallback(() => {
      setActiveConversation(conversationId);
      load();
      return () => {
        setActiveConversation(null);
        // Al salir del chat el botón de pánico vuelve a su lugar.
        setFabLift(0);
      };
    }, [conversationId, load, setActiveConversation, setFabLift]),
  );

  // Mensajes en vivo.
  useEffect(
    () =>
      onChatMessage(({ conversationId: id, message }) => {
        if (id !== conversationId) return;

        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          // El eco de un mensaje mío reemplaza su copia provisional.
          if (message.isMine) {
            const tempIndex = prev.findIndex(
              m =>
                m.pending &&
                m.kind === message.kind &&
                m.body === message.body,
            );
            if (tempIndex >= 0) {
              const next = [...prev];
              next[tempIndex] = message;
              return next;
            }
          }
          return [message, ...prev];
        });

        if (!message.isMine) markRead();
      }),
    [conversationId, markRead],
  );

  // El "visto" del otro vecino.
  useEffect(
    () =>
      onChatRead(({ conversationId: id, readAt }) => {
        if (id !== conversationId) return;
        setConversation(prev =>
          prev ? { ...prev, counterpartLastReadAt: readAt } : prev,
        );
      }),
    [conversationId],
  );

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[messages.length - 1];
      const page = await fetchMessages(conversationId, oldest.createdAt);
      setMessages(prev => [
        ...prev,
        ...page.items.filter(item => !prev.some(m => m.id === item.id)),
      ]);
      setHasMore(page.hasMore);
    } catch {
      /* se reintenta al seguir subiendo */
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, loadingOlder, messages]);

  const deliver = useCallback(
    async (temp: UiMessage) => {
      try {
        const saved = temp.photo
          ? await sendChatImage(conversationId, temp.photo)
          : await sendMessage(conversationId, temp.body);
        setMessages(prev => {
          // Si el eco del socket ya llegó, solo se quita la copia provisional.
          if (prev.some(m => m.id === saved.id)) {
            return prev.filter(m => m.id !== temp.id);
          }
          return prev.map(m => (m.id === temp.id ? saved : m));
        });
      } catch (e: any) {
        setMessages(prev =>
          prev.map(m =>
            m.id === temp.id ? { ...m, pending: false, failed: true } : m,
          ),
        );
        showError(e?.message ?? 'No se pudo enviar el mensaje.');
      }
    },
    [conversationId, showError],
  );

  const onSend = useCallback(() => {
    const body = draft.trim();
    if (!body) return;

    const temp: UiMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderUserId: '',
      kind: 'TEXT',
      body,
      createdAt: new Date().toISOString(),
      isMine: true,
      pending: true,
    };
    setMessages(prev => [temp, ...prev]);
    setDraft('');
    void deliver(temp);
  }, [draft, conversationId, deliver]);

  /** Una foto sale de una vez con el archivo local mientras se sube. */
  const onAttach = useCallback(() => {
    choosePhoto(picked => {
      const photo = picked[0];
      if (!photo) return;

      const temp: UiMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderUserId: '',
        kind: 'IMAGE',
        body: '',
        createdAt: new Date().toISOString(),
        isMine: true,
        pending: true,
        photo,
      };
      setMessages(prev => [temp, ...prev]);
      void deliver(temp);
    }, 1);
  }, [choosePhoto, conversationId, deliver]);

  const retry = useCallback(
    (message: UiMessage) => {
      const again = { ...message, pending: true, failed: false };
      setMessages(prev => prev.map(m => (m.id === message.id ? again : m)));
      void deliver(again);
    },
    [deliver],
  );

  /**
   * Compartir el WhatsApp se confirma: una vez enviado, el número queda en el
   * chat y ya no se puede "des-compartir".
   */
  const onSharePhone = useCallback(() => {
    if (!conversation) return;
    showAlert({
      type: 'question',
      title: '¿Compartir tu WhatsApp?',
      description: `${conversation.counterpart.name} verá tu número en este chat y podrá escribirte o llamarte. Nadie más lo recibe.`,
      buttons: [
        {
          text: 'Compartir',
          style: 'primary',
          onPress: () => {
            setSharing(true);
            shareMyPhone(conversationId)
              .then(message => {
                setMessages(prev =>
                  prev.some(m => m.id === message.id)
                    ? prev
                    : [message, ...prev],
                );
                setConversation(prev =>
                  prev ? { ...prev, myPhoneShared: true } : prev,
                );
              })
              .catch((e: any) =>
                showError(e?.message ?? 'No se pudo compartir tu WhatsApp.'),
              )
              .finally(() => setSharing(false));
          },
        },
        { text: 'Cancelar', style: 'text', onPress: () => undefined },
      ],
    });
  }, [conversation, conversationId, showAlert, showError]);

  /**
   * Reportar abre la conversación a la administración —es lo único que lo
   * hace—, así que se dice antes. Al otro vecino no se le avisa quién reportó.
   */
  const submitReport = useCallback(
    (reason: ChatReportReason, alsoBlock: boolean) => {
      reportConversation(conversationId, reason, alsoBlock)
        .then(() => {
          setConversation(prev =>
            prev
              ? {
                  ...prev,
                  reportedByMe: true,
                  ...(alsoBlock
                    ? { isBlocked: true, blockedByMe: true }
                    : {}),
                }
              : prev,
          );
          showSuccess(
            'La administración revisa la conversación. Al otro vecino no se le dice quién la reportó.',
            'Reporte enviado',
          );
        })
        .catch((e: any) => showError(e?.message ?? 'No se pudo reportar.'));
    },
    [conversationId, showError, showSuccess],
  );

  const onReport = useCallback(() => {
    showAlert({
      type: 'question',
      title: '¿Por qué lo reportas?',
      description:
        'La administración podrá leer esta conversación para revisarla. Nadie más.',
      buttons: [
        ...REPORT_OPTIONS.map(option => ({
          text: option.label,
          style: 'secondary' as const,
          onPress: () =>
            setTimeout(
              () =>
                showAlert({
                  type: 'question',
                  title: '¿También quieres bloquearlo?',
                  description:
                    'Si lo bloqueas, ninguno de los dos podrá escribirle al otro.',
                  buttons: [
                    {
                      text: 'Reportar y bloquear',
                      style: 'danger',
                      onPress: () => submitReport(option.value, true),
                    },
                    {
                      text: 'Solo reportar',
                      style: 'secondary',
                      onPress: () => submitReport(option.value, false),
                    },
                  ],
                }),
              300,
            ),
        })),
        { text: 'Cancelar', style: 'text' as const, onPress: () => undefined },
      ],
    });
  }, [showAlert, submitReport]);

  const onMenu = useCallback(() => {
    if (!conversation) return;
    const blocked = conversation.blockedByMe;

    showAlert({
      type: 'question',
      title: conversation.counterpart.name,
      description: blocked
        ? 'Lo bloqueaste: ninguno de los dos puede escribirle al otro.'
        : 'Si lo bloqueas, ninguno podrá escribirle al otro. No se le avisa.',
      buttons: [
        {
          text: 'Ver el aviso',
          style: 'secondary',
          onPress: () =>
            navigation.navigate('ListingDetail', {
              listingId: conversation.listing.id,
            }),
        },
        ...(conversation.reportedByMe
          ? []
          : [
              {
                text: 'Reportar',
                style: 'danger' as const,
                onPress: () => setTimeout(onReport, 300),
              },
            ]),
        {
          text: blocked ? 'Desbloquear' : 'Bloquear',
          style: blocked ? 'secondary' : 'danger',
          onPress: () => {
            (blocked ? unblockCounterpart : blockCounterpart)(conversationId)
              .then(setConversation)
              .catch((e: any) =>
                showError(e?.message ?? 'No se pudo completar.'),
              );
          },
        },
        { text: 'Cerrar', style: 'text', onPress: () => undefined },
      ],
    });
  }, [conversation, conversationId, navigation, showAlert, showError, onReport]);

  const openPhone = useCallback(
    (phone: string, viaWhatsApp: boolean) => {
      const clean = phone.replace(/[^\d+]/g, '');
      const url = viaWhatsApp
        ? `https://wa.me/${clean.replace('+', '')}`
        : `tel:${clean}`;
      Linking.openURL(url).catch(() =>
        showError('No se pudo abrir la aplicación.'),
      );
    },
    [showError],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: UiMessage; index: number }) => {
      // Lista invertida: el "anterior" en el tiempo es el siguiente índice.
      const older = messages[index + 1];
      const showDay = !older || !sameDay(older.createdAt, item.createdAt);
      const seen =
        item.isMine &&
        !item.pending &&
        !!conversation?.counterpartLastReadAt &&
        new Date(conversation.counterpartLastReadAt) >= new Date(item.createdAt);

      return (
        <View>
          {showDay && (
            <View style={styles.dayWrap}>
              <View style={[styles.dayPill, { backgroundColor: colors.surface }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={colors.textSecondary}>
                  {dayLabel(item.createdAt)}
                </CustomTextComponent>
              </View>
            </View>
          )}
          <Bubble
            message={item}
            seen={seen}
            authHeaders={authHeaders}
            onZoom={setZoomed}
            onRetry={() => retry(item)}
            onWhatsApp={phone => openPhone(phone, true)}
            onCall={phone => openPhone(phone, false)}
          />
        </View>
      );
    },
    [messages, conversation, colors, retry, openPhone, authHeaders],
  );

  if (isLoading || !conversation) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mensajes" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  const canWrite = !conversation.isReadOnly && !conversation.isBlocked;
  const showShare =
    canWrite && conversation.canSharePhone && !conversation.myPhoneShared;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={conversation.counterpart.name}
        subtitle={conversation.counterpart.unitLabel ?? undefined}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'more-vert', onPress: onMenu }}
      />

      {/* El aviso del que se habla, siempre a la vista. */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ListingDetail', {
            listingId: conversation.listing.id,
          })
        }
        style={[
          styles.listingCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {conversation.listing.imageUrl ? (
          <Image
            source={{ uri: conversation.listing.imageUrl }}
            style={styles.listingImg}
          />
        ) : (
          <View
            style={[
              styles.listingImg,
              gs.center,
              { backgroundColor: colors.primarySurface },
            ]}>
            <Icon
              name={conversation.listing.type === 'SERVICE' ? 'handyman' : 'sell'}
              size={20}
              color={colors.primary}
            />
          </View>
        )}
        <View style={gs.flex1}>
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}
            numberOfLines={1}>
            {conversation.listing.title}
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary}>
            {CLOSED_HINT[conversation.listing.status] ??
              conversation.listing.priceLabel}
          </CustomTextComponent>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      {conversation.reportedByMe && !conversation.closedByModeration && (
        <View style={[styles.notice, { backgroundColor: colors.warningLight }]}>
          <Icon name="flag" size={14} color={colors.warning} />
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={colors.textSecondary}
            style={gs.flex1}>
            Reportaste esta conversación. La administración la está revisando.
          </CustomTextComponent>
        </View>
      )}

      <KeyboardAvoidingView
        style={gs.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messages}
          onEndReachedThreshold={0.3}
          onEndReached={loadOlder}
          ListFooterComponent={
            loadingOlder ? (
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}
                style={styles.olderHint}>
                Cargando mensajes anteriores…
              </CustomTextComponent>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textSecondary}
                style={styles.emptyText}>
                {conversation.role === 'INTERESTED'
                  ? 'Escríbele para preguntar por el aviso. Tu número no se comparte.'
                  : 'Le interesa tu aviso. Respóndele por aquí: tu número no se comparte.'}
              </CustomTextComponent>
            </View>
          }
        />

        {showShare && (
          <TouchableOpacity
            onPress={onSharePhone}
            disabled={sharing}
            style={[
              styles.shareChip,
              { backgroundColor: colors.successLight, borderColor: colors.success },
            ]}>
            <Icon name="phone-in-talk" size={16} color={colors.success} />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={colors.success}>
              {sharing ? 'Compartiendo…' : 'Compartir mi WhatsApp'}
            </CustomTextComponent>
          </TouchableOpacity>
        )}

        {canWrite ? (
          <View
            onLayout={liftPanicAbove}
            style={[
              styles.composer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + SPACING.sm,
              },
            ]}>
            <TouchableOpacity
              onPress={onAttach}
              style={styles.attachBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="photo-camera" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe un mensaje"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.textPrimary },
              ]}
            />
            <TouchableOpacity
              onPress={onSend}
              disabled={!draft.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: draft.trim()
                    ? colors.primary
                    : colors.textDisabled,
                },
              ]}>
              <Icon name="send" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            onLayout={liftPanicAbove}
            style={[
              styles.closedBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + SPACING.md,
              },
            ]}>
            <Icon name="lock-outline" size={16} color={colors.textTertiary} />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}
              style={gs.flex1}>
              {conversation.closedByModeration
                ? 'La administración cerró esta conversación después de revisar un reporte.'
                : conversation.isBlocked
                ? conversation.blockedByMe
                  ? 'Bloqueaste a este vecino. Desbloquéalo desde el menú para volver a escribir.'
                  : 'No es posible escribirle a este vecino.'
                : `${CLOSED_HINT[conversation.listing.status] ?? 'El aviso se cerró'}: la conversación queda solo para consulta.`}
            </CustomTextComponent>
          </View>
        )}
      </KeyboardAvoidingView>

      <ImageViewerModal
        uri={zoomed}
        headers={zoomed?.startsWith('http') ? authHeaders : undefined}
        onClose={() => setZoomed(null)}
      />
    </View>
  );
}

// ─── Burbuja ─────────────────────────────────────────────────────────────────

function Bubble({
  message,
  seen,
  authHeaders,
  onZoom,
  onRetry,
  onWhatsApp,
  onCall,
}: {
  message: UiMessage;
  seen: boolean;
  authHeaders?: Record<string, string>;
  onZoom: (uri: string) => void;
  onRetry: () => void;
  onWhatsApp: (phone: string) => void;
  onCall: (phone: string) => void;
}) {
  const { colors } = useTheme();
  const mine = message.isMine;
  const textColor = mine ? colors.textInverse : colors.textPrimary;
  const metaColor = mine ? colors.primaryLight : colors.textTertiary;

  const meta = (
    <View style={styles.meta}>
      <CustomTextComponent fontSize={10} color={metaColor}>
        {message.failed ? 'No se envió' : bubbleTime(message.createdAt)}
      </CustomTextComponent>
      {mine && !message.failed && (
        <Icon
          name={message.pending ? 'schedule' : seen ? 'done-all' : 'done'}
          size={13}
          color={seen ? colors.textInverse : metaColor}
        />
      )}
    </View>
  );

  if (message.kind === 'IMAGE') {
    // Mientras sube se ve el archivo local; ya enviada, se pide al API con la
    // sesión. La URL pública del bucket nunca se usa para el chat.
    const uri = message.photo?.uri
      ?? (message.imagePath ? chatImageUrl(message.imagePath) : null);

    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (message.failed) onRetry();
            else if (uri) onZoom(uri);
          }}
          style={[
            styles.imageBubble,
            {
              backgroundColor: mine ? colors.primary : colors.surface,
              borderColor: message.failed ? colors.error : 'transparent',
              opacity: message.pending ? 0.7 : 1,
            },
          ]}>
          {uri ? (
            <Image
              source={
                message.photo ? { uri } : { uri, headers: authHeaders }
              }
              style={styles.chatImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.chatImage, styles.imageMissing]}>
              <Icon name="broken-image" size={28} color={metaColor} />
            </View>
          )}
          <View style={styles.imageMeta}>{meta}</View>
        </TouchableOpacity>
        {message.failed && (
          <Icon name="error-outline" size={18} color={colors.error} />
        )}
      </View>
    );
  }

  if (message.kind === 'PHONE_SHARED') {
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <View
          style={[
            styles.bubble,
            styles.phoneBubble,
            {
              backgroundColor: mine ? colors.primary : colors.surface,
              borderColor: mine ? colors.primary : colors.success,
            },
          ]}>
          <View style={styles.phoneHead}>
            <Icon
              name="phone-in-talk"
              size={16}
              color={mine ? colors.textInverse : colors.success}
            />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={textColor}>
              {mine ? 'Compartiste tu WhatsApp' : 'Te compartió su WhatsApp'}
            </CustomTextComponent>
          </View>
          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            fontWeight={FONT_WEIGHT.bold as any}
            color={textColor}>
            {message.body}
          </CustomTextComponent>
          {!mine && (
            <View style={styles.phoneActions}>
              <TouchableOpacity
                onPress={() => onWhatsApp(message.body)}
                style={[styles.phoneBtn, { backgroundColor: colors.success }]}>
                <Icon name="chat" size={15} color={colors.textInverse} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={colors.textInverse}>
                  WhatsApp
                </CustomTextComponent>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onCall(message.body)}
                style={[styles.phoneBtn, { backgroundColor: colors.primary }]}>
                <Icon name="call" size={15} color={colors.textInverse} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={colors.textInverse}>
                  Llamar
                </CustomTextComponent>
              </TouchableOpacity>
            </View>
          )}
          {meta}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <TouchableOpacity
        activeOpacity={message.failed ? 0.6 : 1}
        disabled={!message.failed}
        onPress={onRetry}
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          {
            backgroundColor: mine ? colors.primary : colors.surface,
            opacity: message.pending ? 0.75 : 1,
            borderColor: message.failed ? colors.error : 'transparent',
          },
        ]}>
        <CustomTextComponent fontSize={FONT_SIZE.md} color={textColor}>
          {message.body}
        </CustomTextComponent>
        {meta}
      </TouchableOpacity>
      {message.failed && (
        <Icon name="error-outline" size={18} color={colors.error} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  listingImg: { width: 44, height: 44, borderRadius: RADIUS.md },
  messages: { padding: SPACING.md, gap: SPACING.xs },
  dayWrap: { alignItems: 'center', marginVertical: SPACING.sm },
  dayPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  phoneBubble: { gap: 4, minWidth: 220 },
  phoneHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  phoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  olderHint: { textAlign: 'center', marginVertical: SPACING.sm },
  imageBubble: {
    padding: 3,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chatImage: { width: 220, height: 220, borderRadius: 13 },
  imageMissing: { alignItems: 'center', justifyContent: 'center' },
  imageMeta: {
    position: 'absolute',
    right: 10,
    bottom: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  attachBtn: { paddingBottom: 9 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyWrap: {
    // La lista va invertida: sin esto el texto sale de cabeza.
    transform: [{ scaleY: -1 }],
    padding: SPACING.xl,
  },
  emptyText: { textAlign: 'center' },
  shareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: FONT_SIZE.md,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
