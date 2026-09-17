import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';

import { useAlert } from '../providers/context/AlertContext';
import type { PhotoUpload } from '../../infraestructure/services/pets.service';

/**
 * Foto para mascotas: la ficha exige una y el reporte de convivencia exige
 * evidencia. El backend rechaza ambos sin imagen, así que esto no es un extra.
 *
 * Se comprime a 1600 px y calidad 0.7 antes de subir. Una foto de cámara moderna
 * pesa varios MB y el residente suele estar en datos móviles, parado en el
 * pasillo donde acaba de ver lo que va a reportar.
 */
const PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.7 as const,
  maxWidth: 1600,
  maxHeight: 1600,
};

const toUpload = (asset: Asset): PhotoUpload | null => {
  if (!asset.uri) return null;
  return {
    uri: asset.uri,
    type: asset.type ?? 'image/jpeg',
    name: asset.fileName ?? `foto-${Date.now()}.jpg`,
  };
};

/**
 * Android exige pedir CAMERA en caliente, aunque esté declarado en el
 * manifiesto. En iOS lo resuelve el sistema con el texto del Info.plist.
 */
async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Permiso de cámara',
      message: 'Para tomar la foto de tu mascota o la evidencia del reporte.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Ahora no',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function usePhotoPicker() {
  const { showAlert, showWarning } = useAlert();

  /** Abre la cámara. Devuelve null si el residente cancela o niega el permiso. */
  const takePhoto = useCallback(async (): Promise<PhotoUpload | null> => {
    if (!(await ensureCameraPermission())) {
      showWarning(
        'Puedes activarlo desde los ajustes del teléfono, o elegir una foto de la galería.',
        'Sin permiso de cámara',
      );
      return null;
    }

    const result = await launchCamera({ ...PICKER_OPTIONS, saveToPhotos: false });
    if (result.didCancel || !result.assets?.length) return null;
    return toUpload(result.assets[0]);
  }, [showWarning]);

  /** Abre la galería. `limit` 1 devuelve una sola foto. */
  const pickFromLibrary = useCallback(async (limit = 1): Promise<PhotoUpload[]> => {
    const result = await launchImageLibrary({
      ...PICKER_OPTIONS,
      selectionLimit: limit,
    });
    if (result.didCancel || !result.assets?.length) return [];

    return result.assets
      .map(toUpload)
      .filter((photo): photo is PhotoUpload => photo !== null);
  }, []);

  /**
   * Pregunta cómo quiere poner la foto, con el mismo alert del resto de la app.
   * La cámara va primero: en un reporte de convivencia lo normal es que el
   * residente esté viendo el hecho en ese momento.
   */
  const choosePhoto = useCallback((
    onPicked: (photos: PhotoUpload[]) => void,
    limit = 1,
  ) => {
    showAlert({
      type: 'question',
      title: 'Agregar foto',
      description: '¿De dónde la tomamos?',
      buttons: [
        {
          text: 'Cámara',
          icon: 'photo-camera',
          iconLibrary: 'MaterialIcons',
          onPress: () => {
            void takePhoto().then(photo => { if (photo) onPicked([photo]); });
          },
        },
        {
          text: 'Galería',
          icon: 'photo-library',
          iconLibrary: 'MaterialIcons',
          style: 'secondary',
          onPress: () => {
            void pickFromLibrary(limit).then(photos => {
              if (photos.length) onPicked(photos);
            });
          },
        },
        { text: 'Cancelar', style: 'text', onPress: () => undefined },
      ],
    });
  }, [showAlert, takePhoto, pickFromLibrary]);

  return { takePhoto, pickFromLibrary, choosePhoto };
}
