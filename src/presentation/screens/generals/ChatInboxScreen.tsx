import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
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
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import {
  onChatMessage,
  useMarketplaceChatStore,
} from '../../store/marketplace-chat.store';
import { fetchConversations } from '../../../infraestructure/services/marketplace-chat.service';
import type { Conversation } from '../../../domain/responses/MarketplaceChatResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { chatTime } from './chat.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ChatInbox'>;
type InboxRoute = RouteProp<HomeStackParamList, 'ChatInbox'>;

type Filter = 'all' | 'OWNER' | 'INTERESTED';

/**
 * Mis conversaciones de clasificados y servicios.
 *
 * Con `listingId` muestra solo las de un aviso: es lo que abre quien publicó
 * desde su ficha para ver quién le escribió. Sin él, es la bandeja completa,
 * separada entre "Mis avisos" (me escriben a mí) y "Me interesan" (escribo yo).
 */
export default function ChatInboxScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<InboxRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const complexId = useAuthStore(state => state.resident?.complex?.id);
  const refreshUnread = useMarketplaceChatStore(state => state.refreshUnread);

  const [items, setItems] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      const result = await fetchConversations(complexId, 1, params?.listingId);
      setItems(result.items);
      setPage(result.pagination.currentPage);
      setHasNext(result.pagination.hasNextPage);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron cargar tus mensajes.');
    } finally {
      setIsLoading(false);
    }
  }, [complexId, params?.listingId, showError]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (complexId) refreshUnread(complexId);
    }, [load, complexId, refreshUnread]),
  );

  /**
   * Un mensaje nuevo sube su conversación al primer lugar. Si es de una que no
   * está en la lista (la primera vez que alguien escribe), se recarga.
   */
  useEffect(
    () =>
      onChatMessage(({ conversationId, message }) => {
        setItems(prev => {
          const found = prev.find(item => item.id === conversationId);
          if (!found) {
            load();
            return prev;
          }
          const updated: Conversation = {
            ...found,
            lastMessagePreview:
              message.kind === 'PHONE_SHARED'
                ? 'Compartió su WhatsApp'
                : message.kind === 'IMAGE'
                  ? '📷 Foto'
                  : message.body,
            lastMessageAt: message.createdAt,
            lastMessageIsMine: message.isMine,
            unreadCount: message.isMine ? found.unreadCount : found.unreadCount + 1,
          };
          return [updated, ...prev.filter(item => item.id !== conversationId)];
        });
      }),
    [load],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!complexId || !hasNext) return;
    try {
      const next = await fetchConversations(complexId, page + 1, params?.listingId);
      setItems(prev => [
        ...prev,
        ...next.items.filter(item => !prev.some(p => p.id === item.id)),
      ]);
      setPage(next.pagination.currentPage);
      setHasNext(next.pagination.hasNextPage);
    } catch {
      /* se reintenta al seguir bajando */
    }
  }, [complexId, hasNext, page, params?.listingId]);

  const visible =
    filter === 'all' ? items : items.filter(item => item.role === filter);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationRow
        conversation={item}
        onPress={() =>
          navigation.navigate('ChatConversation', { conversationId: item.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={params?.title ?? 'Mensajes'}
        showBack
        onBack={() => navigation.goBack()}
      />

      {!params?.listingId && (
        <View style={styles.tabs}>
          {(
            [
              ['all', 'Todos'],
              ['OWNER', 'Mis avisos'],
              ['INTERESTED', 'Me interesan'],
            ] as const
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    filter === value ? colors.primary : colors.surface,
                },
              ]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium as any}
                color={
                  filter === value ? colors.textInverse : colors.textSecondary
                }>
                {label}
              </CustomTextComponent>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && items.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + SPACING.xxl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.divider }]} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="chat-bubble-outline"
              title="Sin conversaciones"
              description={
                params?.listingId
                  ? 'Todavía nadie te ha escrito por este aviso.'
                  : 'Cuando toques "Me interesa" en un aviso, o alguien te escriba por uno tuyo, la conversación aparece aquí.'
              }
            />
          }
        />
      )}
    </View>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const unread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View>
        <Avatar
          size="lg"
          name={conversation.counterpart.name}
          uri={conversation.counterpart.profilePicture ?? undefined}
        />
        {/* La foto del aviso en la esquina: con varios chats de la misma
            persona, es lo que dice de qué se habla. */}
        <View style={[styles.listingThumb, { borderColor: colors.surface }]}>
          {conversation.listing.imageUrl ? (
            <Image
              source={{ uri: conversation.listing.imageUrl }}
              style={styles.listingThumbImg}
            />
          ) : (
            <View
              style={[
                styles.listingThumbImg,
                gs.center,
                { backgroundColor: colors.primarySurface },
              ]}>
              <Icon
                name={conversation.listing.type === 'SERVICE' ? 'handyman' : 'sell'}
                size={12}
                color={colors.primary}
              />
            </View>
          )}
        </View>
      </View>

      <View style={gs.flex1}>
        <View style={gs.rowBetween}>
          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            fontWeight={(unread ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold) as any}
            color={colors.textPrimary}
            numberOfLines={1}
            style={gs.flex1}>
            {conversation.counterpart.name}
          </CustomTextComponent>
          {!!conversation.lastMessageAt && (
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={unread ? colors.primary : colors.textTertiary}>
              {chatTime(conversation.lastMessageAt)}
            </CustomTextComponent>
          )}
        </View>

        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          numberOfLines={1}>
          {conversation.listing.title}
          {conversation.counterpart.unitLabel
            ? ` · ${conversation.counterpart.unitLabel}`
            : ''}
        </CustomTextComponent>

        <View style={gs.rowBetween}>
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color={unread ? colors.textPrimary : colors.textSecondary}
            fontWeight={(unread ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular) as any}
            numberOfLines={1}
            style={gs.flex1}>
            {conversation.lastMessageIsMine ? 'Tú: ' : ''}
            {conversation.lastMessagePreview ?? ''}
          </CustomTextComponent>
          {unread ? (
            <View style={[styles.unread, { backgroundColor: colors.primary }]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                fontWeight={FONT_WEIGHT.bold as any}
                color={colors.textInverse}>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </CustomTextComponent>
            </View>
          ) : conversation.isReadOnly ? (
            <Icon name="lock-outline" size={14} color={colors.textTertiary} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  list: { paddingHorizontal: SPACING.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 72 },
  listingThumb: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  listingThumbImg: { width: 22, height: 22 },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
