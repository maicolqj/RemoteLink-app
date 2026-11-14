// Copia de EntryLink (PhoneDialerApp): misma pantalla de llamada en las dos apps.

// =============================================================================
// ARCHIVO: src/components/CallActionButton.tsx
// =============================================================================
//
// PASO 8.5b - BOTÓN DE ACCIÓN DURANTE LLAMADA
//
// ¿QUÉ HACE?
// Es un botón circular reutilizable para las acciones durante una llamada:
// mute, speaker, hold, keypad, contactos, etc.
//
// Tiene 3 estados visuales:
//   1. Normal (gris oscuro con ícono blanco)
//   2. Activo (blanco con ícono negro) - cuando está activado (ej: mute ON)
//   3. Destructivo (rojo con ícono blanco) - para el botón de colgar
//
// ¿CÓMO SE USA?
//
//   // Botón normal
//   <CallActionButton iconName="dialpad" label="Teclado" onPress={showKeypad} />
//
//   // Botón con estado activo (toggle)
//   <CallActionButton iconName="mic-off" label="Silenciar"
//     onPress={toggleMute} isActive={isMuted} />
//
//   // Botón de colgar (rojo)
//   <CallActionButton iconName="call-end" label=""
//     onPress={endCall} isDestructive size={70} />
//
// =============================================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

// react-native-vector-icons provee íconos de Material Design
// Usamos MaterialIcons porque tiene todos los íconos de teléfono que necesitamos
import Icon from 'react-native-vector-icons/MaterialIcons';

// -----------------------------------------------------------------------------
// PROPS
// -----------------------------------------------------------------------------
interface CallActionButtonProps {
  /** Nombre del ícono de MaterialIcons (ej: "mic-off", "volume-up", "call-end") */
  iconName: string;

  /** Texto que aparece debajo del botón */
  label: string;

  /** Función que se ejecuta al tocar */
  onPress: () => void;

  /** Si el botón está "activado" (cambia colores a blanco/negro) */
  isActive?: boolean;

  /** Tamaño del botón en píxeles (default: 60) */
  size?: number;

  /** Si es botón de colgar (se pone rojo) */
  isDestructive?: boolean;
}

// -----------------------------------------------------------------------------
// COMPONENTE
// -----------------------------------------------------------------------------
export const CallActionButton: React.FC<CallActionButtonProps> = ({
  iconName,
  label,
  onPress,
  isActive = false,
  size = 60,
  isDestructive = false,
}) => {
  // Determinar colores según el estado del botón
  // Prioridad: isDestructive > isActive > normal
  const backgroundColor = isDestructive
    ? '#FF3B30'   // Rojo iOS (para colgar)
    : isActive
    ? '#FFFFFF'   // Blanco (cuando está activo, ej: mute ON)
    : '#3A3A3C';  // Gris oscuro (estado normal)

  const iconColor = isDestructive
    ? '#FFFFFF'   // Blanco sobre rojo
    : isActive
    ? '#000000'   // Negro sobre blanco
    : '#FFFFFF';  // Blanco sobre gris

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,    // Círculo perfecto
            backgroundColor,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}>
        {/* El ícono ocupa el 45% del tamaño del botón */}
        <Icon name={iconName} size={size * 0.45} color={iconColor} />
      </TouchableOpacity>
      {/* Label debajo del botón (vacío para el botón de colgar) */}
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra sutil para darle profundidad
    elevation: 3,                          // Android shadow
    shadowColor: '#000',                   // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});