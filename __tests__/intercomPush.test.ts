const mockDisplayNotification = jest.fn().mockResolvedValue('id');
const mockCancelNotification = jest.fn().mockResolvedValue(undefined);
const mockCreateChannel = jest.fn().mockResolvedValue('intercom_calls_v1');

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    displayNotification: (...args: unknown[]) => mockDisplayNotification(...args),
    cancelNotification: (...args: unknown[]) => mockCancelNotification(...args),
    createChannel: (...args: unknown[]) => mockCreateChannel(...args),
  },
  AndroidCategory: { CALL: 'call' },
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PUBLIC: 1 },
}));

import {
  INTERCOM_ACTION,
  handleIntercomPushInBackground,
  intercomActionFromPress,
  isIntercomPush,
} from '../src/infraestructure/services/intercomPush';

describe('intercomPush', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reconoce solo los push de citofonía', () => {
    expect(isIntercomPush({ type: 'INTERCOM_CALL_INCOMING' })).toBe(true);
    expect(isIntercomPush({ type: 'PANIC_ALERT' })).toBe(false);
    expect(isIntercomPush(null)).toBe(false);
  });

  it('traduce el botón tocado en la notificación', () => {
    expect(intercomActionFromPress(INTERCOM_ACTION.ANSWER)).toBe('answer');
    expect(intercomActionFromPress(INTERCOM_ACTION.DECLINE)).toBe('decline');
    expect(intercomActionFromPress('default')).toBe('open');
    expect(intercomActionFromPress(undefined)).toBe('open');
  });

  it('una llamada entrante pinta la notificación de llamada con Contestar y Rechazar', async () => {
    const handled = await handleIntercomPushInBackground({
      type: 'INTERCOM_CALL_INCOMING',
      callId: 'c1',
      callerName: 'ANA GÓMEZ',
      unitLabel: 'Torre 1 - 101',
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });

    expect(handled).toBe(true);
    const [notification] = mockDisplayNotification.mock.calls[0] as [any];
    expect(notification.id).toBe('intercom-c1');
    expect(notification.title).toBe('ANA GÓMEZ');
    expect(notification.body).toBe('Te llama portería por la app');
    expect(notification.android.category).toBe('call');
    expect(notification.android.fullScreenAction).toBeDefined();
    expect(notification.android.actions.map((a: any) => a.pressAction.id)).toEqual([
      INTERCOM_ACTION.DECLINE,
      INTERCOM_ACTION.ANSWER,
    ]);
  });

  it('contestada en otro equipo o colgada: deja de sonar', async () => {
    await handleIntercomPushInBackground({ type: 'INTERCOM_CALL_ANSWERED', callId: 'c1' });
    await handleIntercomPushInBackground({ type: 'INTERCOM_CALL_ENDED', callId: 'c2' });
    expect(mockCancelNotification).toHaveBeenCalledWith('intercom-c1');
    expect(mockCancelNotification).toHaveBeenCalledWith('intercom-c2');
    expect(mockDisplayNotification).not.toHaveBeenCalled();
  });

  it('ignora lo que no es de citofonía', async () => {
    expect(await handleIntercomPushInBackground({ type: 'PACKAGE_RECEIVED' })).toBe(false);
  });
});
