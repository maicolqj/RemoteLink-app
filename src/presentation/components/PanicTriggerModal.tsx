import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: SW } = Dimensions.get('window');

interface Props {
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (message: string) => void;
}

export function PanicTriggerModal({ visible, loading, onCancel, onConfirm }: Props) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleConfirm = () => {
    onConfirm(message.trim());
    setMessage('');
  };

  const handleCancel = () => {
    setMessage('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Icon name="warning" size={28} color="#fff" />
            <Text style={styles.headerTitle}>Alerta de pánico</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.description}>
              Se notificará a todos los miembros del complejo. ¿Confirmas activar la alerta?
            </Text>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Mensaje adicional (opcional)"
              placeholderTextColor="#aaa"
              value={message}
              onChangeText={setMessage}
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.charCount}>{message.length}/200</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>Activar alerta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: SW * 0.9,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#c00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: -8,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#c00',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
