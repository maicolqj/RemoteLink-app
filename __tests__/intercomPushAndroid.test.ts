// En Android la notificación de la llamada la publica el receptor nativo
// (IntercomCallReceiver): JS no debe pintar otra, o timbran dos.

const mockDisplayNotification = jest.fn().mockResolvedValue('id');
const mockCancelNotification = jest.fn().mockResolvedValue(undefined);
const mockCancelNative = jest.fn().mockResolvedValue(undefined);

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    displayNotification: (...args: unknown[]) => mockDisplayNotification(...args),
    cancelNotification: (...args: unknown[]) => mockCancelNotification(...args),
    createChannel: jest.fn().mockResolvedValue('intercom_calls_v1'),
  },
  AndroidCategory: { CALL: 'call' },
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PUBLIC: 1 },
}));

jest.mock('../src/infraestructure/services/nativeIntercomCall', () => ({
  NATIVE_CALL_NOTIFICATION: true,
  cancelNativeCallNotification: (...args: unknown[]) => mockCancelNative(...args),
  consumeNativeCallLaunch: jest.fn().mockResolvedValue(null),
}));

import {
  cancelCallNotification,
  handleIntercomPushInBackground,
} from '../src/infraestructure/services/intercomPush';

describe('intercomPush en Android (notificación nativa)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('no pinta la notificación de Notifee: ya la publicó el receptor nativo', async () => {
    const handled = await handleIntercomPushInBackground({
      type: 'INTERCOM_CALL_INCOMING',
      callId: 'c1',
    });
    expect(handled).toBe(true);
    expect(mockDisplayNotification).not.toHaveBeenCalled();
  });

  it('quitar la llamada también quita la notificación nativa', async () => {
    await cancelCallNotification('c1');
    expect(mockCancelNative).toHaveBeenCalledWith('c1');
  });
});
