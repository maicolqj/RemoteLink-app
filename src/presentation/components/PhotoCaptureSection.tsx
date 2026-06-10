import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ColorsApp } from '../constants/CustomColors';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhotoCaptureSectionProps {
  photoUri: string | null;
  onCameraPress: () => void;
  onScanPress?: () => void;
  onGalleryPress?: () => void;
  onRemove: () => void;
  showScanOption?: boolean;
  showGalleryOption?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CARD_BG = '#0D2347';
const BORDER  = 'rgba(255,255,255,0.08)';

const PhotoCaptureSection: React.FC<PhotoCaptureSectionProps> = ({
  photoUri,
  onCameraPress,
  onScanPress,
  onGalleryPress,
  onRemove,
  showScanOption = true,
  showGalleryOption = true,
}) => {
  // Función auxiliar para manejar el caso de que onScanPress sea undefined
  const handleScanPress = () => {
    if (onScanPress) onScanPress();
  };

  // Función auxiliar para manejar el caso de que onGalleryPress sea undefined
  const handleGalleryPress = () => {
    if (onGalleryPress) onGalleryPress();
  };

  // Determinar qué acciones mostrar
  const showActions = () => {
    const actions = [];
    
    actions.push(
      <TouchableOpacity key="camera" style={st.camBtn} onPress={onCameraPress} activeOpacity={0.8}>
        <Icon name="photo-camera" size={16} color={ColorsApp.accent()} style={{ marginRight: 6 }} />
        <Text style={st.camBtnText}>{photoUri ? 'Retomar foto' : 'Tomar foto'}</Text>
      </TouchableOpacity>
    );
    
    if (showScanOption && onScanPress) {
      actions.push(
        <TouchableOpacity key="scan" style={st.camBtn} onPress={handleScanPress} activeOpacity={0.8}>
          <Icon name="document-scanner" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
          <Text style={[st.camBtnText, { color: '#8B5CF6' }]}>Escanear doc.</Text>
        </TouchableOpacity>
      );
    }
    
    if (showGalleryOption && onGalleryPress) {
      actions.push(
        <TouchableOpacity key="gallery" style={st.camBtn} onPress={handleGalleryPress} activeOpacity={0.8}>
          <Icon name="photo-library" size={16} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={[st.camBtnText, { color: '#10B981' }]}>Galería</Text>
        </TouchableOpacity>
      );
    }
    
    return actions;
  };

  return (
    <View style={st.section}>
      <TouchableOpacity style={st.circle} onPress={onCameraPress} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={st.img} />
        ) : (
          <View style={st.placeholder}>
            <Icon name="camera-alt" size={28} color="rgba(255,255,255,0.45)" />
            <Text style={st.placeholderText}>Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={st.actions}>
        {showActions()}
      </View>

      {photoUri ? (
        <TouchableOpacity onPress={onRemove} style={st.removeBtn}>
          <Icon name="delete" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: '#EF4444' }}>Quitar foto</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  section:         { alignItems: 'center', marginBottom: 24 },
  circle:          { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: CARD_BG, marginBottom: 12 },
  img:             { width: '100%', height: '100%' },
  placeholder:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  placeholderText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  actions:         { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  camBtn:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  camBtnText:      { fontSize: 13, color: ColorsApp.accent(), fontWeight: '600' },
  removeBtn:       { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});

export default PhotoCaptureSection;


/* MODOS DE USO

 Uso actual (sigue funcionando sin cambios)
<PhotoCaptureSection
  photoUri={photoUri}
  onCameraPress={() => takePhoto()}
  onScanPress={() => scanDocument()}
  onRemove={() => setPhotoUri(null)}
/>

 Nuevo uso con todas las opciones
<PhotoCaptureSection
  photoUri={photoUri}
  onCameraPress={() => takePhoto()}
  onScanPress={() => scanDocument()}
  onGalleryPress={() => openGallery()}
  onRemove={() => setPhotoUri(null)}
/>

 Personalizar qué opciones mostrar
<PhotoCaptureSection
  photoUri={photoUri}
  onCameraPress={() => takePhoto()}
  onGalleryPress={() => openGallery()}
  onRemove={() => setPhotoUri(null)}
  showScanOption={false}
/>
*/