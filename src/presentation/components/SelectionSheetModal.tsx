import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ColorsApp } from '../constants/CustomColors';
import CustomTextComponent from './CustomTextComponent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SheetItemHelpers {
  onPress: () => void;
  isSelected: boolean;
}

interface SelectionSheetModalProps<T> {
  // Trigger
  label: string;
  triggerIcon: string;
  triggerValue?: string;
  triggerPlaceholder: string;
  // Validation
  error?: string;
  touched?: boolean;
  // Disabled state (e.g. resident picker before unit chosen)
  disabled?: boolean;
  disabledHint?: string;
  // Sheet header
  title: string;
  // Data — managed by parent
  items: T[];
  keyExtractor: (item: T) => string;
  loading: boolean;
  fetchError?: string | null;
  onOpen: () => void;     // called when sheet opens so parent can fetch
  onRetry: () => void;
  onSelectItem: (item: T) => void;
  selectedId?: string;
  // Item rendering
  renderItem: (item: T, helpers: SheetItemHelpers) => React.ReactNode;
  // Search (optional)
  searchable?: boolean;
  filterFn?: (item: T, query: string) => boolean;
  // Pagination (optional)
  onEndReached?: () => void;
  loadingMore?: boolean;
  // Empty state
  emptyIcon?: string;
  emptyText?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CARD_BG = '#0D2347';
const SURFACE = '#0A1E40';
const BORDER  = 'rgba(255,255,255,0.08)';
const SH      = Dimensions.get('screen').height;

function SelectionSheetModal<T>({
  label,
  triggerIcon,
  triggerValue,
  triggerPlaceholder,
  error,
  touched,
  disabled,
  disabledHint,
  title,
  items,
  keyExtractor,
  loading,
  fetchError,
  onOpen,
  onRetry,
  onSelectItem,
  selectedId,
  renderItem,
  searchable,
  filterFn,
  onEndReached,
  loadingMore,
  emptyIcon = 'list',
  emptyText = 'Sin resultados',
}: SelectionSheetModalProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const hasErr = touched && !!error;

  const openSheet = () => {
    setSearch('');
    setOpen(true);
    onOpen();
  };

  const closeSheet = () => setOpen(false);

  const filtered = (() => {
    if (!searchable || !filterFn) return items;
    const q = search.trim().toLowerCase();
    return q ? items.filter(item => filterFn(item, q)) : items;
  })();

  if (disabled) {
    return (
      <View style={st.group}>
        <Text style={st.label}>{label}</Text>
        <View style={[st.trigger, { opacity: 0.4 }]}>
          <Icon name={triggerIcon} size={16} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
          <Text style={st.triggerPlaceholder}>{disabledHint ?? triggerPlaceholder}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.group}>
      <Text style={st.label}>{label}</Text>
      <TouchableOpacity
        style={[st.trigger, hasErr && st.triggerErr]}
        onPress={openSheet}
        activeOpacity={0.75}
      >
        <Icon
          name={triggerIcon}
          size={16}
          color={triggerValue ? ColorsApp.accent() : 'rgba(255,255,255,0.3)'}
          style={{ marginRight: 8 }}
        />
        {triggerValue
          ? <View style={{ flex: 1 }}><Text style={st.triggerValue}>{triggerValue}</Text></View>
          : <Text style={st.triggerPlaceholder}>{triggerPlaceholder}</Text>}
        <Icon name={triggerValue ? 'edit' : 'chevron-right'} size={16} color="rgba(255,255,255,0.25)" />
      </TouchableOpacity>
      {hasErr && <Text style={st.fieldError}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={st.overlay}>
          <View style={st.panel}>
            <View style={st.handle} />
            <View style={st.topRow}>
              <CustomTextComponent style={st.sheetTitle}>{title}</CustomTextComponent>
              <TouchableOpacity onPress={closeSheet} style={{ padding: 4 }}>
                <Icon name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={st.search}>
                <Icon name="search" size={15} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
                <TextInput
                  style={st.searchInput}
                  placeholder="Filtrar…"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={search}
                  keyboardType='phone-pad'
                  onChangeText={setSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Icon name="close" size={14} color="rgba(255,255,255,0.35)" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {loading ? (
              <View style={st.center}>
                <ActivityIndicator color={ColorsApp.accent()} size="large" />
              </View>
            ) : fetchError ? (
              <View style={st.center}>
                <Icon name="warning" size={32} color="#F59E0B" />
                <Text style={[st.hint, { color: '#F59E0B', textAlign: 'center' }]}>{fetchError}</Text>
                <TouchableOpacity style={st.retryBtn} onPress={onRetry}>
                  <Text style={st.retryText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={keyExtractor}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  loadingMore
                    ? <ActivityIndicator color={ColorsApp.accent()} style={{ marginVertical: 12 }} />
                    : null
                }
                ListEmptyComponent={
                  <View style={st.center}>
                    <Icon name={emptyIcon} size={40} color="rgba(255,255,255,0.1)" />
                    <Text style={st.hint}>{search ? 'Sin coincidencias' : emptyText}</Text>
                  </View>
                }
                renderItem={({ item }) =>
                  renderItem(item, {
                    isSelected: keyExtractor(item) === selectedId,
                    onPress: () => { onSelectItem(item); closeSheet(); },
                  }) as React.ReactElement
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  group:            { marginBottom: 16 },
  label:            { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, marginBottom: 6 },
  trigger:          { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12 },
  triggerErr:       { borderColor: '#EF4444' },
  triggerValue:     { flex: 1, fontSize: 14, color: '#fff' },
  triggerPlaceholder:{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  fieldError:       { fontSize: 11, color: '#EF4444', marginTop: 4 },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  panel:            { backgroundColor: SURFACE, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: SH * 0.75 },
  handle:           { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  topRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetTitle:       { fontSize: 16, fontWeight: '700', color: '#fff' },
  center:           { alignItems: 'center', paddingVertical: 40, gap: 10 },
  hint:             { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  retryBtn:         { marginTop: 10, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: 'rgba(85,194,218,0.12)', borderWidth: 1, borderColor: 'rgba(85,194,218,0.3)' },
  retryText:        { color: '#55C2DA', fontSize: 13, fontWeight: '600' },
  search:           { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 10, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  searchInput:      { flex: 1, fontSize: 14, color: '#fff' },
});

export default SelectionSheetModal;
