// =============================================================================
// Abre la pantalla de la llamada con portería desde cualquier parte de la app.
//
// - Suena (socket) o se llamó a portería → pantalla IntercomCall.
// - La app vuelve al frente o arranca desde la notificación de la llamada →
//   se le pregunta a la API si hay una sonando (el socket no estaba).
// =============================================================================

import { useEffect, type RefObject } from 'react';
import { AppState } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';

import { intercomCallService } from '../../../infraestructure/services/intercomCall.service';
import { getDeviceId } from '../../../infraestructure/services/DeviceIdService';
import type { RootStackParamList } from '../../navigation/types/NavigationTypes';

type Props = { navigationRef: RefObject<NavigationContainerRef<RootStackParamList> | null> };

export function IntercomCallBootstrap({ navigationRef }: Props) {
  useEffect(() => {
    void getDeviceId()
      .then(id => intercomCallService.setDeviceId(id))
      .catch(() => {});

    const openCallScreen = () => {
      const nav = navigationRef.current;
      if (!nav?.isReady()) return;
      if (nav.getCurrentRoute()?.name === 'IntercomCall') return;
      nav.navigate('IntercomCall');
    };

    const unsubscribe = intercomCallService.subscribe(info => {
      if (info && (info.state === 'RINGING' || info.state === 'DIALING')) openCallScreen();
    });

    const restore = () => {
      void intercomCallService.restore().then(info => { if (info) openCallScreen(); });
    };
    // Margen para que la navegación esté lista en un arranque en frío.
    const timer = setTimeout(restore, 800);
    const appState = AppState.addEventListener('change', next => {
      if (next === 'active') restore();
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
      appState.remove();
    };
  }, [navigationRef]);

  return null;
}
