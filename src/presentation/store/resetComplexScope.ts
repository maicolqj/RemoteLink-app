// =============================================================================
// Reinicio de todo lo que pertenece al conjunto abierto.
//
// Al cambiar de conjunto no puede quedar a la vista nada del anterior (saldo,
// paquetes, visitas, avisos, chat…). Cada store vuelve a su estado inicial
// con `getInitialState()` de zustand y Apollo se vacía.
//
// Fuera a propósito: auth (la sesión sigue), settings (son del equipo) y
// panic (la alarma suena siempre, sea del conjunto que sea).
// Un store nuevo con datos del conjunto TIENE que entrar en esta lista.
// =============================================================================

import type { StoreApi, UseBoundStore } from 'zustand';
import apolloClient from '../../data/lib/apollo/client';
import { useAmenitiesStore } from './amenities.store';
import { useFinancesStore } from './finances.store';
import { useMaintenanceStore } from './maintenance.store';
import { useMarketplaceChatStore } from './marketplace-chat.store';
import { useMarketplaceStore } from './marketplace.store';
import { useNotificationsStore } from './notifications.store';
import { usePackagesStore } from './packages.store';
import { usePetsStore } from './pets.store';
import { usePqrfStore } from './pqrf.store';
import { useVisitsStore } from './visits.store';
import { useVotingStore } from './voting.store';

type AnyStore = UseBoundStore<StoreApi<any>>;

export const COMPLEX_SCOPED_STORES: AnyStore[] = [
  useAmenitiesStore,
  useFinancesStore,
  useMaintenanceStore,
  useMarketplaceChatStore,
  useMarketplaceStore,
  useNotificationsStore,
  usePackagesStore,
  usePetsStore,
  usePqrfStore,
  useVisitsStore,
  useVotingStore,
];

export async function resetComplexScopedState(): Promise<void> {
  for (const store of COMPLEX_SCOPED_STORES) {
    store.setState(store.getInitialState(), true);
  }
  await apolloClient.clearStore();
}
