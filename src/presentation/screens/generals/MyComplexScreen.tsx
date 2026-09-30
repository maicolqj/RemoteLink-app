import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import apolloClientInstance from '../../../data/lib/apollo/client';
import { GET_MY_COMPLEX_INFO } from '../../../domain/graphql/complex-info.queries';
import type {
  ComplexContact,
  ComplexContactCategory,
  ComplexDocumentCategory,
  MyComplexDocument,
  MyComplexInfo,
} from '../../../domain/responses/ComplexInfoResponseModel';
import {
  CONTACT_CATEGORY,
  DOCUMENT_CATEGORY,
  formatDocDate,
  isRecent,
} from './complex-info.shared';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Section = 'documents' | 'contacts';

/**
 * "Mi Conjunto": lo que la administración publica para los residentes —manual
 * de convivencia, reglamento, actas, estados financieros— y el directorio de
 * contactos del conjunto, con los datos generales arriba.
 */
export default function MyComplexScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();
  const complexId = useAuthStore(s => s.resident?.complex?.id);

  const [data, setData] = useState<MyComplexInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<Section>('documents');
  const [search, setSearch] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const load = useCallback(async () => {
    if (!complexId) {
      setLoading(false);
      return;
    }
    try {
      const { data: res, error } = await apolloClientInstance.query<{ myComplexInfo: MyComplexInfo }>({
        query: GET_MY_COMPLEX_INFO,
        variables: { complexId },
        fetchPolicy: 'network-only',
      });
      if (error) throw error;
      setData(res?.myComplexInfo ?? null);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar la información del conjunto.');
    } finally {
      setLoading(false);
    }
  }, [complexId, showError]);

  // En cada foco: al volver de un documento confirmado, el contador baja.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const open = useCallback(
    (url: string, fallback: string) => {
      Linking.openURL(url).catch(() => showError(fallback));
    },
    [showError],
  );

  const openDocument = useCallback(
    (item: MyComplexDocument) =>
      (navigation as any).navigate('ComplexDocument', {
        documentId: item.document.id,
        title: item.document.title,
      }),
    [navigation],
  );

  const term = search.trim().toLowerCase();

  const documentGroups = useMemo(() => {
    const docs = (data?.documents ?? []).filter(d => {
      if (onlyPending && (!d.document.requiresAcknowledgement || d.acknowledgedAt)) return false;
      if (!term) return true;
      return (
        d.document.title.toLowerCase().includes(term) ||
        (d.document.description ?? '').toLowerCase().includes(term) ||
        DOCUMENT_CATEGORY[d.document.category].label.toLowerCase().includes(term)
      );
    });
    const pinned = docs.filter(d => d.document.isPinned);
    const rest = docs.filter(d => !d.document.isPinned);
    const byCategory = new Map<ComplexDocumentCategory, MyComplexDocument[]>();
    for (const d of rest) {
      const list = byCategory.get(d.document.category) ?? [];
      list.push(d);
      byCategory.set(d.document.category, list);
    }
    const groups: { key: string; label: string; items: MyComplexDocument[] }[] = [];
    if (pinned.length) groups.push({ key: 'pinned', label: 'Destacados', items: pinned });
    (Object.keys(DOCUMENT_CATEGORY) as ComplexDocumentCategory[]).forEach(c => {
      const items = byCategory.get(c);
      if (items?.length) groups.push({ key: c, label: DOCUMENT_CATEGORY[c].label, items });
    });
    return groups;
  }, [data, term, onlyPending]);

  const contactGroups = useMemo(() => {
    const contacts = (data?.contacts ?? []).filter(c => {
      if (!term) return true;
      return [c.name, c.role, c.schedule].some(v => (v ?? '').toLowerCase().includes(term));
    });
    const byCategory = new Map<ComplexContactCategory, ComplexContact[]>();
    for (const c of contacts) {
      const list = byCategory.get(c.category) ?? [];
      list.push(c);
      byCategory.set(c.category, list);
    }
    return (Object.keys(CONTACT_CATEGORY) as ComplexContactCategory[])
      .filter(c => byCategory.has(c))
      .map(c => ({ key: c, label: CONTACT_CATEGORY[c].label, icon: CONTACT_CATEGORY[c].icon, items: byCategory.get(c)! }));
  }, [data, term]);

  if (loading) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mi Conjunto" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mi Conjunto" showBack onBack={() => navigation.goBack()} />
        <EmptyState
          icon="apartment"
          title="No pudimos cargar tu conjunto"
          description="Revisa tu conexión. Si acabas de mudarte, la administración debe activar tu ficha."
          actionLabel="Reintentar"
          onAction={() => { setLoading(true); load(); }}
        />
      </View>
    );
  }

  const { complex, pendingAcknowledgements } = data;
  const place = [complex.address, complex.city].filter(Boolean).join(', ');

  const actions = [
    complex.phoneNumber && {
      icon: 'call', label: 'Llamar',
      onPress: () => open(`tel:${complex.phoneNumber!.replace(/[^\d+]/g, '')}`, 'No se pudo abrir la aplicación de llamadas.'),
    },
    complex.email && {
      icon: 'email', label: 'Correo',
      onPress: () => open(`mailto:${complex.email}`, 'No hay una aplicación de correo configurada.'),
    },
    place && {
      icon: 'place', label: 'Cómo llegar',
      onPress: () => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${complex.name}, ${place}`)}`, 'No se pudo abrir el mapa.'),
    },
    complex.website && {
      icon: 'language', label: 'Sitio web',
      onPress: () => open(/^https?:\/\//.test(complex.website!) ? complex.website! : `https://${complex.website}`, 'No se pudo abrir el sitio.'),
    },
  ].filter(Boolean) as { icon: string; label: string; onPress: () => void }[];

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Mi Conjunto" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* ── El conjunto ───────────────────────────────────────── */}
        <Card elevated>
          <View style={styles.complexHeader}>
            {complex.logoUrl ? (
              <Image source={{ uri: complex.logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.primarySurface }]}>
                <Icon name="apartment" size={28} color={colors.primary} />
              </View>
            )}
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
                {complex.name}
              </CustomTextComponent>
              {!!place && (
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                  {place}
                </CustomTextComponent>
              )}
              {!!complex.nit && (
                <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
                  NIT {complex.nit}
                </CustomTextComponent>
              )}
            </View>
          </View>
          {!!complex.description && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.description}>
              {complex.description}
            </CustomTextComponent>
          )}
          {actions.length > 0 && (
            <View style={styles.actions}>
              {actions.map(a => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.action, { backgroundColor: colors.primarySurface }]}
                  onPress={a.onPress}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}>
                  <Icon name={a.icon} size={20} color={colors.primary} />
                  <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
                    {a.label}
                  </CustomTextComponent>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* ── Pendientes de confirmar ───────────────────────────── */}
        {pendingAcknowledgements > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => { setSection('documents'); setOnlyPending(p => !p); }}
            style={[styles.pending, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            <Icon name="assignment-late" size={22} color={colors.warning} />
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
                {pendingAcknowledgements === 1
                  ? 'Tienes 1 documento por confirmar'
                  : `Tienes ${pendingAcknowledgements} documentos por confirmar`}
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary}>
                {onlyPending ? 'Toca para ver todos los documentos' : 'La administración te pide leerlos. Toca para verlos.'}
              </CustomTextComponent>
            </View>
            <Icon name={onlyPending ? 'close' : 'chevron-right'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* ── Pestañas + búsqueda ───────────────────────────────── */}
        <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([
            { key: 'documents', label: `Documentos · ${data.documents.length}` },
            { key: 'contacts', label: `Contactos · ${data.contacts.length}` },
          ] as const).map(s => {
            const active = section === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.segmentBtn, active && { backgroundColor: colors.primary }]}
                onPress={() => setSection(s.key)}
                activeOpacity={0.85}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  fontWeight={FONT_WEIGHT.semibold as any}
                  color={active ? colors.textInverse : colors.textSecondary}>
                  {s.label}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={section === 'documents' ? 'Buscar un documento' : 'Buscar un contacto'}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {section === 'documents' ? (
          documentGroups.length === 0 ? (
            <Card>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
                {data.documents.length === 0
                  ? 'La administración aún no ha publicado documentos.'
                  : 'Ningún documento coincide con tu búsqueda.'}
              </CustomTextComponent>
            </Card>
          ) : (
            documentGroups.map(g => (
              <View key={g.key}>
                <SectionTitle text={g.label} count={g.items.length} />
                <Card padding={0}>
                  {g.items.map((item, i) => (
                    <View key={item.document.id}>
                      {i > 0 && <View style={[gs.divider, styles.rowDivider]} />}
                      <DocumentRow item={item} onPress={() => openDocument(item)} />
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )
        ) : contactGroups.length === 0 ? (
          <Card>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
              {data.contacts.length === 0
                ? 'La administración aún no ha publicado el directorio.'
                : 'Ningún contacto coincide con tu búsqueda.'}
            </CustomTextComponent>
          </Card>
        ) : (
          contactGroups.map(g => (
            <View key={g.key}>
              <SectionTitle text={g.label} count={g.items.length} />
              <Card padding={0}>
                {g.items.map((c, i) => (
                  <View key={c.id}>
                    {i > 0 && <View style={[gs.divider, styles.rowDivider]} />}
                    <ContactRow contact={c} icon={g.icon} onOpen={open} />
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Piezas ───────────────────────────────────────────────────────────────────

function SectionTitle({ text, count }: { text: string; count?: number }) {
  const { colors } = useTheme();
  return (
    <CustomTextComponent
      fontSize={FONT_SIZE.xs}
      fontWeight={FONT_WEIGHT.semibold as any}
      color={colors.textTertiary}
      style={styles.sectionTitle}>
      {text.toUpperCase()}
      {count ? ` · ${count}` : ''}
    </CustomTextComponent>
  );
}

function DocumentRow({ item, onPress }: { item: MyComplexDocument; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { document: doc, acknowledgedAt, hasFile } = item;
  const category = DOCUMENT_CATEGORY[doc.category];
  const pendingAck = doc.requiresAcknowledgement && !acknowledgedAt;
  const meta = [
    doc.effectiveDate ? `Vigente desde ${formatDocDate(doc.effectiveDate)}` : `Actualizado ${formatDocDate(doc.contentUpdatedAt)}`,
    hasFile ? 'PDF' : null,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon name={category.icon} size={20} color={colors.primary} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={2}>
          {doc.title}
        </CustomTextComponent>
        {!!doc.description && (
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} numberOfLines={1}>
            {doc.description}
          </CustomTextComponent>
        )}
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={styles.rowMeta}>
          {meta}
        </CustomTextComponent>
        {(pendingAck || acknowledgedAt || isRecent(doc.contentUpdatedAt) || doc.audience === 'OWNERS_ONLY') && (
          <View style={styles.chips}>
            {pendingAck && <StatusChip label="Por confirmar" variant="warning" />}
            {!!acknowledgedAt && doc.requiresAcknowledgement && <StatusChip label="Confirmado" variant="success" />}
            {isRecent(doc.contentUpdatedAt) && !acknowledgedAt && <StatusChip label="Nuevo" variant="info" />}
            {doc.audience === 'OWNERS_ONLY' && <StatusChip label="Propietarios" variant="neutral" />}
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={22} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

/** Un celular colombiano (3xx…): el que tiene WhatsApp. */
function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (/^3\d{9}$/.test(digits)) return `57${digits}`;
  if (/^573\d{9}$/.test(digits)) return digits;
  return null;
}

function ContactRow({
  contact, icon, onOpen,
}: {
  contact: ComplexContact;
  icon: string;
  onOpen: (url: string, fallback: string) => void;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const wa = contact.phone ? whatsappNumber(contact.phone) : null;

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: contact.category === 'EMERGENCY' ? colors.errorLight : colors.primarySurface }]}>
        <Icon name={icon} size={20} color={contact.category === 'EMERGENCY' ? colors.error : colors.primary} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
          {contact.name}
        </CustomTextComponent>
        {!!contact.role && (
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary}>
            {contact.role}
          </CustomTextComponent>
        )}
        {!!contact.schedule && (
          <View style={styles.inline}>
            <Icon name="schedule" size={12} color={colors.textTertiary} />
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={{ flexShrink: 1 }}>
              {contact.schedule}
            </CustomTextComponent>
          </View>
        )}
        {!!contact.notes && (
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
            {contact.notes}
          </CustomTextComponent>
        )}
      </View>
      <View style={styles.contactActions}>
        {!!contact.phone && (
          <RoundAction
            icon="call"
            label={`Llamar a ${contact.name}`}
            onPress={() => onOpen(`tel:${contact.phone!.replace(/[^\d+]/g, '')}`, 'No se pudo abrir la aplicación de llamadas.')}
          />
        )}
        {!!wa && (
          <RoundAction
            icon="chat"
            label={`WhatsApp a ${contact.name}`}
            onPress={() => onOpen(`https://wa.me/${wa}`, 'No se pudo abrir WhatsApp.')}
          />
        )}
        {!!contact.email && (
          <RoundAction
            icon="email"
            label={`Escribir a ${contact.name}`}
            onPress={() => onOpen(`mailto:${contact.email}`, 'No hay una aplicación de correo configurada.')}
          />
        )}
      </View>
    </View>
  );
}

function RoundAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.round, { backgroundColor: colors.primarySurface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}>
      <Icon name={icon} size={18} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  complexHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.xs,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 56,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    marginLeft: SPACING.md + 40 + SPACING.sm,
  },
  rowMeta: {
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
