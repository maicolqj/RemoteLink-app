// =============================================================================
// Llamadas por internet con portería (citofonía por la app), lado residente.
//
// Es el mismo motor de EntryLink: WebRTC entre los equipos (o por el TURN
// propio) y la API solo para iniciar, contestar, colgar y pasar la
// señalización. Una llamada a la vez.
//
//   portería → residente: llega `intercom:call:incoming` (o el push) → el
//     residente contesta → portería arma la oferta → este equipo responde.
//   residente → portería: startToSecurity → contesta un vigilante de esa
//     portería (`intercom:call:accepted`) → este equipo arma la oferta.
//
// Los eventos del socket los reenvía SocketProvider (handleSocketEvent): la
// conexión vive allí.
// =============================================================================

import { AppState, PermissionsAndroid, Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from 'react-native-webrtc';

import apolloClient from '../../data/lib/apollo/client';
import {
  ANSWER_INTERCOM_CALL,
  END_INTERCOM_CALL,
  GET_CURRENT_INTERCOM_CALL,
  REJECT_INTERCOM_CALL,
  SEND_INTERCOM_SIGNAL,
  START_SECURITY_INTERCOM_CALL,
} from '../../domain/graphql/intercom';
import { cancelCallNotification } from './intercomPush';
import { cancelNativeCallNotification, consumeNativeCallLaunch } from './nativeIntercomCall';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type IntercomCallState =
  | 'RINGING'
  | 'DIALING'
  | 'CONNECTING'
  | 'ACTIVE'
  | 'HOLDING'
  | 'DISCONNECTED';

export type IceServer = { urls: string[]; username?: string | null; credential?: string | null };

type CallSession = {
  call: {
    id: string;
    direction: 'INCOMING' | 'OUTGOING';
    voiceState: 'RINGING' | 'ACTIVE' | 'ENDED' | null;
    agentName?: string | null;
    securityPostName?: string | null;
  };
  iceServers: IceServer[];
};

/** Lo que la pantalla de la llamada pinta. */
export type IntercomCallInfo = {
  callId: string;
  /** true = portería me llama; false = yo llamé a portería. */
  isIncoming: boolean;
  state: IntercomCallState;
  /** "Portería norte", o el vigilante si ya contestó. */
  displayName: string;
  subtitle: string;
  muted: boolean;
  speakerOn: boolean;
  onHold: boolean;
  /** Por qué terminó (solo con state DISCONNECTED). */
  endReason?: string;
};

type IncomingPayload = { callId: string; callerName?: string; unitLabel?: string };
type SignalPayload = { callId: string; kind: 'offer' | 'answer' | 'candidate'; payload: string };

type Listener = (info: IntercomCallInfo | null) => void;

const SECURITY_LABEL = 'Portería';

// ── Servicio ─────────────────────────────────────────────────────────────────

class IntercomCallService {
  private info: IntercomCallInfo | null = null;
  private iceServers: IceServer[] = [];
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];
  private listeners = new Set<Listener>();
  private deviceId = '';
  private pendingAction: { callId?: string; action: 'answer' | 'decline' } | null = null;

  /**
   * Con la app en pantalla timbra JS. Fuera de ella ya timbra la notificación
   * nativa (IntercomCallReceiver): sonar también aquí eran dos timbres a la vez.
   */
  private startRingingIfVisible(): void {
    if (this.pendingAction || AppState.currentState !== 'active') return;
    const info = this.info;
    if (!info || info.state !== 'RINGING') return;
    void cancelNativeCallNotification(info.callId);
    InCallManager.startRingtone('_DEFAULT_', [800, 600], 'playback', 30);
  }

  /** Lo elegido en la notificación nativa (Contestar / Rechazar) pasa a ser la acción pendiente. */
  private async takeNativeLaunch(): Promise<void> {
    const launch = await consumeNativeCallLaunch();
    if (launch && launch.action !== 'open') this.pendingAction = { action: launch.action, callId: launch.callId };
  }

  setDeviceId(deviceId: string): void {
    this.deviceId = deviceId;
  }

  /** La pantalla y el arranque escuchan cada cambio de la llamada. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getCall(): IntercomCallInfo | null {
    return this.info ? { ...this.info } : null;
  }

  /** "Contestar" o "Rechazar" en la notificación; se aplica al cargar la llamada. */
  setPendingAction(action: 'answer' | 'decline', callId?: string): void {
    this.pendingAction = { action, callId };
    void this.applyPendingAction();
  }

  // ── Socket (lo reenvía SocketProvider) ─────────────────────────────────────

  handleSocketEvent(event: string, payload: any): void {
    switch (event) {
      case 'intercom:call:incoming':
        this.onIncoming(payload);
        break;
      case 'intercom:call:accepted':
        this.onAccepted(payload);
        break;
      case 'intercom:call:ended':
        this.onEnded(payload);
        break;
      case 'intercom:signal':
        this.onSignal(payload);
        break;
    }
  }

  /**
   * La app se abrió desde la notificación de la llamada (o volvió del fondo):
   * el socket no estaba cuando sonó, así que se pregunta a la API.
   */
  async restore(): Promise<IntercomCallInfo | null> {
    await this.takeNativeLaunch();
    if (this.info) {
      await this.applyPendingAction();
      // Volvió al frente con la llamada sonando: ahora timbra la app.
      this.startRingingIfVisible();
      return this.getCall();
    }
    try {
      const { data } = await apolloClient.query<{ currentIntercomCall: CallSession | null }>({
        query: GET_CURRENT_INTERCOM_CALL,
        fetchPolicy: 'no-cache',
      });
      const session = data?.currentIntercomCall;
      // Para el residente, lo que le suena es lo que portería le hizo (OUTGOING
      // visto desde portería).
      if (!session || session.call.voiceState !== 'RINGING' || session.call.direction !== 'OUTGOING') {
        return null;
      }
      this.iceServers = session.iceServers;
      this.setIncoming({ callId: session.call.id, callerName: session.call.agentName ?? '' });
      await this.applyPendingAction();
      return this.getCall();
    } catch {
      return null;
    }
  }

  // ── Acciones ───────────────────────────────────────────────────────────────

  /** El residente llama a una portería (la elegida, o la única). */
  async startToSecurity(input: {
    complexId: string;
    securityPostId?: string;
    securityPostName?: string;
  }): Promise<IntercomCallInfo> {
    if (this.info) throw new Error('Ya tienes una llamada en curso.');

    const { data } = await apolloClient.mutate<{ startSecurityIntercomCall: CallSession }>({
      mutation: START_SECURITY_INTERCOM_CALL,
      variables: {
        input: {
          complexId: input.complexId,
          ...(input.securityPostId ? { securityPostId: input.securityPostId } : {}),
        },
      },
    });
    const session = data!.startSecurityIntercomCall;
    this.iceServers = session.iceServers;
    this.info = {
      callId: session.call.id,
      isIncoming: false,
      state: 'DIALING',
      displayName: session.call.securityPostName ?? input.securityPostName ?? SECURITY_LABEL,
      subtitle: 'Llamada por la app',
      muted: false,
      speakerOn: false,
      onHold: false,
    };
    InCallManager.start({ media: 'audio', ringback: '_DTMF_' });
    this.changed();
    return this.getCall()!;
  }

  async answer(): Promise<void> {
    const info = this.info;
    if (!info?.isIncoming || info.state !== 'RINGING') return;
    InCallManager.stopRingtone();
    const { data } = await apolloClient.mutate<{ answerIntercomCall: CallSession }>({
      mutation: ANSWER_INTERCOM_CALL,
      variables: { input: { callId: info.callId, deviceId: this.deviceId || undefined } },
    });
    this.iceServers = data?.answerIntercomCall.iceServers ?? this.iceServers;
    InCallManager.start({ media: 'audio' });
    this.setState('CONNECTING');
    try {
      await this.createPeer();
    } catch (err) {
      await this.hangUp();
      throw err;
    }
  }

  async reject(): Promise<void> {
    const info = this.info;
    if (!info) return;
    InCallManager.stopRingtone();
    await apolloClient
      .mutate({ mutation: REJECT_INTERCOM_CALL, variables: { callId: info.callId } })
      .catch(() => {});
    this.finish('REJECTED');
  }

  async hangUp(): Promise<void> {
    const info = this.info;
    if (!info) return;
    await apolloClient
      .mutate({ mutation: END_INTERCOM_CALL, variables: { callId: info.callId } })
      .catch(() => {});
    this.finish('LOCAL');
  }

  toggleMute(): void {
    if (!this.info) return;
    this.info.muted = !this.info.muted;
    this.applyTrackState();
    this.changed();
  }

  toggleSpeaker(): void {
    if (!this.info) return;
    this.info.speakerOn = !this.info.speakerOn;
    InCallManager.setForceSpeakerphoneOn(this.info.speakerOn);
    this.changed();
  }

  toggleHold(): void {
    if (!this.info || (this.info.state !== 'ACTIVE' && this.info.state !== 'HOLDING')) return;
    this.info.onHold = !this.info.onHold;
    this.applyTrackState();
    this.setState(this.info.onHold ? 'HOLDING' : 'ACTIVE');
  }

  // ── Eventos ────────────────────────────────────────────────────────────────

  private onIncoming(payload: IncomingPayload): void {
    if (!payload?.callId || this.info) return;
    this.setIncoming(payload);
  }

  private onAccepted(payload: { callId: string; deviceId?: string }): void {
    const info = this.info;
    if (!info || payload.callId !== info.callId) return;

    if (info.isIncoming) {
      // Contestó otro celular de esta misma cuenta: aquí deja de sonar.
      if (info.state === 'RINGING' && payload.deviceId !== this.deviceId) {
        InCallManager.stopRingtone();
        this.finish('ANSWERED_ELSEWHERE');
      }
      return;
    }

    // Llamé a portería y contestó un vigilante: se arma la oferta.
    InCallManager.stopRingback();
    this.setState('CONNECTING');
    void this.createPeer()
      .then(() => this.sendOffer())
      .catch(err => {
        if (__DEV__) console.warn('[Intercom] No se pudo iniciar el audio:', err);
        void this.hangUp();
      });
  }

  private onEnded(payload: { callId: string; reason?: string }): void {
    if (!this.info || payload.callId !== this.info.callId) return;
    InCallManager.stopRingtone();
    this.finish(payload.reason ?? 'REMOTE');
  }

  private onSignal(signal: SignalPayload): void {
    if (!this.info || signal.callId !== this.info.callId) return;
    void this.handleSignal(signal).catch(err => {
      if (__DEV__) console.warn('[Intercom] Señal inválida:', err);
    });
  }

  // ── WebRTC ─────────────────────────────────────────────────────────────────

  private async createPeer(): Promise<void> {
    if (this.pc) return;
    // WebRTC no pide el micrófono por sí solo en Android: sin permiso la
    // llamada conecta pero el otro no oye nada.
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Micrófono para hablar con portería',
        message: 'RemoteLink necesita el micrófono para las llamadas con portería.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Ahora no',
      });
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Sin permiso de micrófono no se puede hablar con portería.');
      }
    }
    this.localStream = (await mediaDevices.getUserMedia({ audio: true, video: false })) as MediaStream;

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers.map(server => ({
        urls: server.urls,
        ...(server.username ? { username: server.username } : {}),
        ...(server.credential ? { credential: server.credential } : {}),
      })),
    });
    this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));

    pc.addEventListener('icecandidate', (event: any) => {
      if (!event.candidate || !this.info) return;
      void this.sendSignal('candidate', JSON.stringify(event.candidate));
    });
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected') {
        if (this.info && this.info.state !== 'ACTIVE' && this.info.state !== 'HOLDING') this.setState('ACTIVE');
      } else if (pc.connectionState === 'failed') {
        void this.hangUp();
      }
    });
    this.pc = pc;
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc) return;
    const offer = await this.pc.createOffer({ offerToReceiveAudio: true });
    await this.pc.setLocalDescription(offer);
    await this.sendSignal('offer', JSON.stringify(offer));
  }

  private async handleSignal(signal: SignalPayload): Promise<void> {
    const body = JSON.parse(signal.payload);
    if (signal.kind === 'offer') {
      await this.createPeer();
      await this.pc!.setRemoteDescription(new RTCSessionDescription(body));
      await this.flushCandidates();
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      await this.sendSignal('answer', JSON.stringify(answer));
    } else if (signal.kind === 'answer') {
      await this.pc?.setRemoteDescription(new RTCSessionDescription(body));
      await this.flushCandidates();
    } else if (signal.kind === 'candidate') {
      const candidate = new RTCIceCandidate(body);
      if (this.pc?.remoteDescription) await this.pc.addIceCandidate(candidate);
      else this.pendingCandidates.push(candidate);
    }
  }

  private async flushCandidates(): Promise<void> {
    const pending = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of pending) await this.pc?.addIceCandidate(candidate);
  }

  private async sendSignal(kind: SignalPayload['kind'], payload: string): Promise<void> {
    if (!this.info) return;
    await apolloClient
      .mutate({
        mutation: SEND_INTERCOM_SIGNAL,
        variables: { input: { callId: this.info.callId, kind, payload } },
      })
      .catch(() => {});
  }

  private applyTrackState(): void {
    const info = this.info;
    if (!info) return;
    this.localStream?.getAudioTracks().forEach(track => { track.enabled = !info.muted && !info.onHold; });
    this.pc?.getReceivers().forEach(receiver => {
      if (receiver.track) receiver.track.enabled = !info.onHold;
    });
  }

  // ── Estado ─────────────────────────────────────────────────────────────────

  private setIncoming(payload: IncomingPayload): void {
    this.info = {
      callId: payload.callId,
      isIncoming: true,
      state: 'RINGING',
      displayName: payload.callerName || SECURITY_LABEL,
      subtitle: 'Te llama portería por la app',
      muted: false,
      speakerOn: false,
      onHold: false,
    };
    // Si ya se eligió en la notificación, no se hace sonar otra vez.
    this.startRingingIfVisible();
    this.changed();
  }

  private async applyPendingAction(): Promise<void> {
    const pending = this.pendingAction;
    const info = this.info;
    if (!pending || !info || info.state !== 'RINGING') return;
    if (pending.callId && pending.callId !== info.callId) return;
    this.pendingAction = null;
    if (pending.action === 'answer') await this.answer().catch(() => {});
    else await this.reject().catch(() => {});
  }

  private setState(state: IntercomCallState): void {
    if (!this.info) return;
    this.info = { ...this.info, state };
    this.changed();
  }

  private finish(reason: string): void {
    const info = this.info;
    this.info = null;
    try {
      this.localStream?.getTracks().forEach(track => track.stop());
      this.pc?.close();
    } catch {
      // ya estaba cerrada
    }
    this.localStream = null;
    this.pc = null;
    this.pendingCandidates = [];
    InCallManager.stopRingtone();
    InCallManager.stop();
    if (!info) return;
    void cancelCallNotification(info.callId);
    this.emit({ ...info, state: 'DISCONNECTED', endReason: reason });
  }

  private changed(): void {
    if (this.info && this.info.state !== 'RINGING') void cancelCallNotification(this.info.callId);
    this.emit(this.getCall());
  }

  private emit(info: IntercomCallInfo | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(info);
      } catch {
        // un oyente roto no tumba la llamada
      }
    });
  }
}

export const intercomCallService = new IntercomCallService();
