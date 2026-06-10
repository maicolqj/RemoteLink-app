// =============================================================================
// ARCHIVO: src/components/PropertyTypeSelector.tsx
// =============================================================================
//
// Selector horizontal de tipo de propiedad.
// Se muestra encima del teclado numérico.
//
//   [ 🏠 Casa ]  [ 🏢 Apto ]  [ 🏛 Oficina ]
//
// Es DINÁMICO: solo muestra los tipos que existen en el conjunto.
// Por ejemplo, si solo hay apartamentos, solo muestra "Apto".
//
// =============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { PropertyType, PropertyTypeConfig } from '../../shared/types/api.types';


const { width: wp, height: hp } = Dimensions.get('screen');
// Configuración visual de cada tipo
const TYPE_CONFIGS: Record<PropertyType, PropertyTypeConfig> = {
  HOUSE: {
    type: 'HOUSE',
    label: 'Casa',
    icon: 'home',
    placeholder: 'Ej: 39',
    keyboardType: 'default',
  },
  APARTMENT: {
    type: 'APARTMENT',
    label: 'Apto',
    icon: 'apartment',
    placeholder: 'Ej: 5-601',
    keyboardType: 'default',
  },
  OFFICE: {
    type: 'OFFICE',
    label: 'Oficina',
    icon: 'business',
    placeholder: 'Ej: 4B',
    keyboardType: 'default',
  },
};

interface PropertyTypeSelectorProps {
  /** Tipos disponibles en este conjunto (viene del backend) */
  availableTypes: PropertyType[];
  /** Tipo actualmente seleccionado */
  selectedType: PropertyType;
  /** Callback cuando el portero toca un tipo */
  onSelect: (type: PropertyType) => void;
}

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  availableTypes,
  selectedType,
  onSelect,
}) => {
  return (
    <View style={{...styles.container}}>
      {availableTypes.map((type) => {
        const config = TYPE_CONFIGS[type];
        const isSelected = type === selectedType;

        return (
          <TouchableOpacity
            key={type}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(type)}
            activeOpacity={0.7}>
            <Icon
              name={config.icon}
              size={20}
              color={isSelected ? '#FFFFFF' : '#8E8E93'}
            />
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Exportar configs para usarlas en otros componentes
export { TYPE_CONFIGS };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: wp * 0.03,
    paddingVertical: hp * 0.01,
    marginTop: hp * 0.02,
    width: wp,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'center',
    // backgroundColor: 'red'

  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp * 0.03,
    paddingVertical: wp * 0.02,
    borderRadius: (wp  * 0.05) / 2,
    backgroundColor: '#2A2A2E',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#8E8E93',
    fontSize: wp * 0.03,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
